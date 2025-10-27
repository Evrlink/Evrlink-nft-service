import http from "node:http";
import { config as loadEnv } from "dotenv";
import { ethers } from "ethers";

import { mintGreetingCard } from "./lib/mint-greeting-card.ts";

loadEnv();

const listenPort = Number(process.env.MINT_API_PORT ?? 8787);
const listenHost = process.env.MINT_API_HOST ?? "0.0.0.0";
const apiKey = process.env.MINT_API_KEY;
const contractAddressEnv = process.env.CONTRACT_ADDRESS;

if (!apiKey) {
  throw new Error("MINT_API_KEY is required to start the mint API server");
}

const rpcUrl = process.env.SEPOLIA_RPC_URL ?? process.env.BASE_SEPOLIA_RPC_URL;

if (!rpcUrl) {
  throw new Error("Set SEPOLIA_RPC_URL (or BASE_SEPOLIA_RPC_URL) in your environment");
}

const privateKey = process.env.PRIVATE_KEY;

if (!privateKey) {
  throw new Error("PRIVATE_KEY is required to sign mint transactions");
}

const provider = new ethers.JsonRpcProvider(rpcUrl);
const signer = new ethers.Wallet(privateKey, provider);

async function readRequestBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error("Request body too large"));
      }
    });

    req.on("end", () => resolve(body));
    req.on("error", (error) => reject(error));
  });
}

function sendJson(res: http.ServerResponse, statusCode: number, payload: unknown) {
  const data = JSON.stringify(payload, (_, value) =>
    typeof value === "bigint" ? value.toString() : value
  );
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
  });
  res.end(data);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method !== "POST" || !req.url || !req.url.startsWith("/mint")) {
      sendJson(res, 404, { error: "Not Found" });
      return;
    }

    const requestKey = req.headers["x-api-key"];
    if (requestKey !== apiKey) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    const rawBody = await readRequestBody(req);
    if (!rawBody) {
      sendJson(res, 400, { error: "Empty request body" });
      return;
    }

    let body: {
      tokenURI?: string;
      contractAddress?: string;
      recipient?: string;
    };

    try {
      body = JSON.parse(rawBody);
    } catch {
      sendJson(res, 400, { error: "Invalid JSON body" });
      return;
    }

    const tokenURI = body.tokenURI ?? process.env.TOKEN_URI;
    if (!tokenURI) {
      sendJson(res, 400, { error: "tokenURI is required" });
      return;
    }

    const contractAddress = body.contractAddress ?? contractAddressEnv;
    if (!contractAddress) {
      sendJson(res, 400, { error: "contractAddress is required" });
      return;
    }

    const recipient = body.recipient;
    if (!recipient) {
      sendJson(res, 400, { error: "recipient is required" });
      return;
    }

    const result = await mintGreetingCard({
      contractAddress,
      tokenURI,
      recipient,
      signer,
    });

    sendJson(res, 200, {
      success: true,
      transactionHash: result.transactionHash,
      tokenId: result.tokenId,
      mintPrice: result.mintPrice,
      recipient,
    });
  } catch (error) {
    console.error("Mint API error:", error);
    sendJson(res, 500, { error: "Minting failed" });
  }
});

server.listen(listenPort, listenHost, () => {
  console.log(`Mint API listening on http://${listenHost}:${listenPort}/mint`);
});
