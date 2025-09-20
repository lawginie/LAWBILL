"use client";

import { useState } from "react";
import { useAccount } from "wagmi";

interface BillData {
  clientName: string;
  clientAddress: string;
  matterDescription: string;
  courtType: string;
  services: Array<{
    description: string;
    hours: number;
    rate: number;
    amount: number;
  }>;
  disbursements: Array<{
    description: string;
    amount: number;
  }>;
  subtotal: number;
  vat: number;
  total: number;
  date: string;
}

interface ContractIntegrationProps {
  billData: BillData;
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
}

// Smart Contract ABI for LegalBillContract
const LEGAL_BILL_ABI = [
  {
    "inputs": [
      {
        "components": [
          { "internalType": "address", "name": "attorney", "type": "address" },
          { "internalType": "address", "name": "payer", "type": "address" },
          { "internalType": "string", "name": "caseNumber", "type": "string" },
          { "internalType": "string", "name": "description", "type": "string" },
          { "internalType": "string", "name": "currency", "type": "string" },
          { "internalType": "uint256", "name": "total", "type": "uint256" },
          { "internalType": "string[]", "name": "serviceDescriptions", "type": "string[]" },
          { "internalType": "uint256[]", "name": "serviceAmounts", "type": "uint256[]" },
          { "internalType": "string[]", "name": "disbursementDescriptions", "type": "string[]" },
          { "internalType": "uint256[]", "name": "disbursementAmounts", "type": "uint256[]" }
        ],
        "internalType": "struct BillStorage.CreateBillParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "createBill",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// Contract address on Base (you'll need to deploy the contract first)
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; // Replace with actual deployed contract address

export default function ContractIntegration({ billData, onSuccess, onError }: ContractIntegrationProps) {
  const { address } = useAccount();
  const [isStoring, setIsStoring] = useState(false);
  const [payerAddress, setPayerAddress] = useState("");
  const [txHash, setTxHash] = useState("");

  const storeBillOnChain = async () => {
    if (!address) {
      onError?.("Please connect your wallet first");
      return;
    }

    if (!payerAddress) {
      onError?.("Please enter the payer's wallet address");
      return;
    }

    try {
      setIsStoring(true);

      // Simulate blockchain storage (replace with actual contract interaction when deployed)
      const billHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      // Store bill data in localStorage for demo purposes
      const billRecord = {
        id: Date.now(),
        hash: billHash,
        attorney: address,
        payer: payerAddress,
        billData,
        timestamp: new Date().toISOString()
      };

      const existingBills = JSON.parse(localStorage.getItem('legalBills') || '[]');
      existingBills.push(billRecord);
      localStorage.setItem('legalBills', JSON.stringify(existingBills));

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      setTxHash(billHash);
      onSuccess?.(billHash);
      setIsStoring(false);

    } catch (err) {
      console.error("Error storing bill:", err);
      onError?.("Failed to store bill");
      setIsStoring(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Blockchain Storage</h2>
      <p className="text-gray-600 mb-4">
        Store this legal bill securely on the blockchain for immutable record keeping and transparent billing.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client Wallet Address (Payer)
          </label>
          <input
            type="text"
            value={payerAddress}
            onChange={(e) => setPayerAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0x..."
            disabled={isStoring}
          />
          <p className="text-xs text-gray-500 mt-1">
            The wallet address of the client who will pay this bill
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">Bill Summary for Blockchain</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-medium">Client:</span> {billData.clientName}</p>
            <p><span className="font-medium">Matter:</span> {billData.matterDescription}</p>
            <p><span className="font-medium">Court:</span> {billData.courtType}</p>
            <p><span className="font-medium">Total Amount:</span> R {billData.total.toFixed(2)}</p>
            <p><span className="font-medium">Services:</span> {billData.services.filter(s => s.description).length} items</p>
            <p><span className="font-medium">Disbursements:</span> {billData.disbursements.filter(d => d.description).length} items</p>
          </div>
        </div>

        {!address && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              Please connect your wallet to store the bill on the blockchain.
            </p>
          </div>
        )}

        {CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">
              Smart contract not deployed yet. Please deploy the LegalBillContract to Base network first.
            </p>
          </div>
        )}

        <button
          onClick={storeBillOnChain}
          disabled={
            !address || 
            !payerAddress || 
            isStoring ||
            CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000"
          }
          className={`w-full py-3 rounded-lg font-medium transition-colors ${
            !address || 
            !payerAddress || 
            isStoring ||
            CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000"
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}
        >
          {isStoring ? "Storing Bill..." : "Store Bill on Blockchain"}
        </button>

        {txHash && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm">
              ✓ Bill stored successfully!
            </p>
            <p className="text-xs text-green-600 mt-1">
              Hash: {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="font-medium text-gray-900 mb-2">Benefits of Blockchain Storage:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Immutable record that cannot be altered</li>
          <li>• Transparent billing for client verification</li>
          <li>• Secure payment processing with smart contracts</li>
          <li>• Automated dispute resolution mechanisms</li>
          <li>• Compliance with digital record-keeping requirements</li>
        </ul>
      </div>
    </div>
  );
}