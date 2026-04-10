export const LandRegistryABI = [
    {
        inputs: [],
        stateMutability: "nonpayable",
        type: "constructor",
    },
    // ─── Registration ───
    {
        inputs: [
            { internalType: "string", name: "_surveyNumber", type: "string" },
            { internalType: "string", name: "_location", type: "string" },
            { internalType: "uint256", name: "_area", type: "uint256" },
            { internalType: "string", name: "_documentsCID", type: "string" },
        ],
        name: "registerLand",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "_tokenId", type: "uint256" }],
        name: "approveLand",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "uint256", name: "_tokenId", type: "uint256" },
            { internalType: "string", name: "_reason", type: "string" },
        ],
        name: "rejectLand",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    // ─── Transfer ───
    {
        inputs: [
            { internalType: "uint256", name: "_tokenId", type: "uint256" },
            { internalType: "address", name: "_buyer", type: "address" },
        ],
        name: "initiateTransfer",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "_tokenId", type: "uint256" }],
        name: "acceptTransfer",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "_tokenId", type: "uint256" }],
        name: "approveTransfer",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "uint256", name: "_tokenId", type: "uint256" },
            { internalType: "string", name: "_reason", type: "string" },
        ],
        name: "rejectTransfer",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    // ─── Disputes ───
    {
        inputs: [
            { internalType: "uint256", name: "_tokenId", type: "uint256" },
            { internalType: "string", name: "_evidenceCID", type: "string" },
        ],
        name: "raiseDispute",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "uint256", name: "_tokenId", type: "uint256" },
            { internalType: "bool", name: "_resolved", type: "bool" },
        ],
        name: "resolveDispute",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    // ─── View Functions ───
    {
        inputs: [{ internalType: "uint256", name: "_tokenId", type: "uint256" }],
        name: "getLandDetails",
        outputs: [
            {
                components: [
                    { internalType: "uint256", name: "tokenId", type: "uint256" },
                    { internalType: "string", name: "surveyNumber", type: "string" },
                    { internalType: "string", name: "location", type: "string" },
                    { internalType: "uint256", name: "area", type: "uint256" },
                    { internalType: "string", name: "documentsCID", type: "string" },
                    { internalType: "address", name: "owner", type: "address" },
                    { internalType: "uint8", name: "status", type: "uint8" },
                    { internalType: "uint256", name: "registeredAt", type: "uint256" },
                    { internalType: "uint256", name: "approvedAt", type: "uint256" },
                ],
                internalType: "struct LandRegistry.LandParcel",
                name: "",
                type: "tuple",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "_tokenId", type: "uint256" }],
        name: "getOwnershipHistory",
        outputs: [
            {
                components: [
                    { internalType: "address", name: "owner", type: "address" },
                    { internalType: "uint256", name: "from", type: "uint256" },
                    { internalType: "uint256", name: "to", type: "uint256" },
                    { internalType: "string", name: "txType", type: "string" },
                ],
                internalType: "struct LandRegistry.OwnershipRecord[]",
                name: "",
                type: "tuple[]",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "_tokenId", type: "uint256" }],
        name: "getTransferDetails",
        outputs: [
            {
                components: [
                    { internalType: "uint256", name: "tokenId", type: "uint256" },
                    { internalType: "address", name: "from", type: "address" },
                    { internalType: "address", name: "to", type: "address" },
                    { internalType: "uint8", name: "status", type: "uint8" },
                    { internalType: "uint256", name: "initiatedAt", type: "uint256" },
                    { internalType: "uint256", name: "completedAt", type: "uint256" },
                ],
                internalType: "struct LandRegistry.TransferRequest",
                name: "",
                type: "tuple",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "getTotalParcels",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "string", name: "_surveyNumber", type: "string" }],
        name: "getTokenIdBySurvey",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
        name: "ownerOf",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "address", name: "_registrar", type: "address" }],
        name: "addRegistrar",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [{ internalType: "address", name: "_registrar", type: "address" }],
        name: "removeRegistrar",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            { internalType: "bytes32", name: "role", type: "bytes32" },
            { internalType: "address", name: "account", type: "address" },
        ],
        name: "hasRole",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "ADMIN_ROLE",
        outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "REGISTRAR_ROLE",
        outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        stateMutability: "view",
        type: "function",
    },
    // ─── Events ───
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
            { indexed: true, internalType: "address", name: "owner", type: "address" },
            { indexed: false, internalType: "string", name: "surveyNumber", type: "string" },
            { indexed: false, internalType: "string", name: "location", type: "string" },
            { indexed: false, internalType: "uint256", name: "area", type: "uint256" },
        ],
        name: "LandRegistered",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
            { indexed: true, internalType: "address", name: "registrar", type: "address" },
        ],
        name: "LandApproved",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
            { indexed: true, internalType: "address", name: "from", type: "address" },
            { indexed: true, internalType: "address", name: "to", type: "address" },
        ],
        name: "TransferInitiated",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
            { indexed: true, internalType: "address", name: "registrar", type: "address" },
        ],
        name: "TransferApproved",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
            { indexed: true, internalType: "address", name: "reporter", type: "address" },
            { indexed: false, internalType: "string", name: "evidenceCID", type: "string" },
        ],
        name: "DisputeRaised",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, internalType: "uint256", name: "tokenId", type: "uint256" },
            { indexed: false, internalType: "bool", name: "resolved", type: "bool" },
            { indexed: true, internalType: "address", name: "registrar", type: "address" },
        ],
        name: "DisputeResolved",
        type: "event",
    },
] as const;

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";
