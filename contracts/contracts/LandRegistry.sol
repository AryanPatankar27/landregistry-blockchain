// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title LandRegistry
 * @notice Core contract for the TerraChain land registry system.
 *         Each land parcel is an ERC-721 NFT. Only registrars can approve
 *         registrations and transfers. Dispute management freezes transfers.
 */
contract LandRegistry is
    ERC721,
    ERC721URIStorage,
    ERC721Enumerable,
    AccessControl,
    ReentrancyGuard
{
    // ──────────────────── Roles ────────────────────
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // ──────────────────── Counters ────────────────────
    uint256 private _nextTokenId;

    // ──────────────────── Enums ────────────────────
    enum ParcelStatus {
        Pending,
        Approved,
        Rejected,
        UnderDispute
    }

    enum TransferStatus {
        None,
        Initiated,
        BuyerAccepted,
        RegistrarApproved,
        Rejected,
        Completed
    }

    // ──────────────────── Structs ────────────────────
    struct LandParcel {
        uint256 tokenId;
        string surveyNumber;
        string location;
        uint256 area; // in sq meters
        string documentsCID; // IPFS CID
        address owner;
        ParcelStatus status;
        uint256 registeredAt;
        uint256 approvedAt;
    }

    struct TransferRequest {
        uint256 tokenId;
        address from;
        address to;
        TransferStatus status;
        uint256 initiatedAt;
        uint256 completedAt;
    }

    struct OwnershipRecord {
        address owner;
        uint256 from;
        uint256 to; // 0 = current
        string txType; // "REGISTRATION" or "TRANSFER"
    }

    struct Dispute {
        uint256 tokenId;
        address reporter;
        string evidenceCID;
        bool resolved;
        uint256 raisedAt;
        uint256 resolvedAt;
    }

    // ──────────────────── Storage ────────────────────
    mapping(uint256 => LandParcel) public parcels;
    mapping(uint256 => TransferRequest) public transfers;
    mapping(uint256 => OwnershipRecord[]) public ownershipHistory;
    mapping(uint256 => Dispute[]) public disputes;
    mapping(string => uint256) public surveyToToken;

    uint256[] public allTokenIds;

    // ──────────────────── Events ────────────────────
    event LandRegistered(
        uint256 indexed tokenId,
        address indexed owner,
        string surveyNumber,
        string location,
        uint256 area
    );
    event LandApproved(uint256 indexed tokenId, address indexed registrar);
    event LandRejected(
        uint256 indexed tokenId,
        address indexed registrar,
        string reason
    );
    event TransferInitiated(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
    );
    event TransferAccepted(uint256 indexed tokenId, address indexed buyer);
    event TransferApproved(
        uint256 indexed tokenId,
        address indexed registrar
    );
    event TransferRejected(
        uint256 indexed tokenId,
        address indexed registrar,
        string reason
    );
    event TransferCompleted(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
    );
    event DisputeRaised(
        uint256 indexed tokenId,
        address indexed reporter,
        string evidenceCID
    );
    event DisputeResolved(
        uint256 indexed tokenId,
        bool resolved,
        address indexed registrar
    );

    // ──────────────────── Constructor ────────────────────
    constructor() ERC721("TerraChain Land", "TERRA") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(REGISTRAR_ROLE, msg.sender);
    }

    // ──────────────────── Land Registration ────────────────────

    /**
     * @notice Register a new land parcel. Anyone can submit a registration.
     *         It will be in Pending status until a registrar approves it.
     */
    function registerLand(
        string memory _surveyNumber,
        string memory _location,
        uint256 _area,
        string memory _documentsCID
    ) external nonReentrant returns (uint256) {
        require(bytes(_surveyNumber).length > 0, "Survey number required");
        require(bytes(_location).length > 0, "Location required");
        require(_area > 0, "Area must be > 0");
        require(bytes(_documentsCID).length > 0, "Documents CID required");
        require(surveyToToken[_surveyNumber] == 0, "Survey number already registered");

        _nextTokenId++;
        uint256 tokenId = _nextTokenId;

        parcels[tokenId] = LandParcel({
            tokenId: tokenId,
            surveyNumber: _surveyNumber,
            location: _location,
            area: _area,
            documentsCID: _documentsCID,
            owner: msg.sender,
            status: ParcelStatus.Pending,
            registeredAt: block.timestamp,
            approvedAt: 0
        });

        surveyToToken[_surveyNumber] = tokenId;
        allTokenIds.push(tokenId);

        emit LandRegistered(tokenId, msg.sender, _surveyNumber, _location, _area);
        return tokenId;
    }

    /**
     * @notice Registrar approves a pending land registration.
     *         This mints the ERC-721 NFT to the owner.
     */
    function approveLand(uint256 _tokenId) external onlyRole(REGISTRAR_ROLE) nonReentrant {
        LandParcel storage parcel = parcels[_tokenId];
        require(parcel.status == ParcelStatus.Pending, "Not pending");

        parcel.status = ParcelStatus.Approved;
        parcel.approvedAt = block.timestamp;

        _safeMint(parcel.owner, _tokenId);

        ownershipHistory[_tokenId].push(
            OwnershipRecord({
                owner: parcel.owner,
                from: block.timestamp,
                to: 0,
                txType: "REGISTRATION"
            })
        );

        emit LandApproved(_tokenId, msg.sender);
    }

    /**
     * @notice Registrar rejects a pending land registration.
     */
    function rejectLand(uint256 _tokenId, string memory _reason)
        external
        onlyRole(REGISTRAR_ROLE)
    {
        LandParcel storage parcel = parcels[_tokenId];
        require(parcel.status == ParcelStatus.Pending, "Not pending");

        parcel.status = ParcelStatus.Rejected;

        emit LandRejected(_tokenId, msg.sender, _reason);
    }

    // ──────────────────── Land Transfer ────────────────────

    /**
     * @notice Owner initiates a transfer to a buyer.
     */
    function initiateTransfer(uint256 _tokenId, address _buyer) external nonReentrant {
        require(ownerOf(_tokenId) == msg.sender, "Not owner");
        require(_buyer != address(0), "Invalid buyer");
        require(_buyer != msg.sender, "Cannot transfer to self");
        require(parcels[_tokenId].status == ParcelStatus.Approved, "Not approved");
        require(transfers[_tokenId].status == TransferStatus.None ||
                transfers[_tokenId].status == TransferStatus.Completed ||
                transfers[_tokenId].status == TransferStatus.Rejected,
                "Transfer already in progress");

        transfers[_tokenId] = TransferRequest({
            tokenId: _tokenId,
            from: msg.sender,
            to: _buyer,
            status: TransferStatus.Initiated,
            initiatedAt: block.timestamp,
            completedAt: 0
        });

        emit TransferInitiated(_tokenId, msg.sender, _buyer);
    }

    /**
     * @notice Buyer accepts a pending transfer request.
     */
    function acceptTransfer(uint256 _tokenId) external {
        TransferRequest storage xfer = transfers[_tokenId];
        require(xfer.to == msg.sender, "Not the buyer");
        require(xfer.status == TransferStatus.Initiated, "Not initiated");

        xfer.status = TransferStatus.BuyerAccepted;

        emit TransferAccepted(_tokenId, msg.sender);
    }

    /**
     * @notice Registrar approves a transfer, completing the NFT transfer.
     */
    function approveTransfer(uint256 _tokenId)
        external
        onlyRole(REGISTRAR_ROLE)
        nonReentrant
    {
        TransferRequest storage xfer = transfers[_tokenId];
        require(xfer.status == TransferStatus.BuyerAccepted, "Buyer has not accepted");

        // Close previous owner's record
        OwnershipRecord[] storage history = ownershipHistory[_tokenId];
        if (history.length > 0) {
            history[history.length - 1].to = block.timestamp;
        }

        // Transfer NFT
        _transfer(xfer.from, xfer.to, _tokenId);

        // Update parcel owner
        parcels[_tokenId].owner = xfer.to;

        // Add new ownership record
        history.push(
            OwnershipRecord({
                owner: xfer.to,
                from: block.timestamp,
                to: 0,
                txType: "TRANSFER"
            })
        );

        xfer.status = TransferStatus.Completed;
        xfer.completedAt = block.timestamp;

        emit TransferApproved(_tokenId, msg.sender);
        emit TransferCompleted(_tokenId, xfer.from, xfer.to);
    }

    /**
     * @notice Registrar rejects a transfer.
     */
    function rejectTransfer(uint256 _tokenId, string memory _reason)
        external
        onlyRole(REGISTRAR_ROLE)
    {
        TransferRequest storage xfer = transfers[_tokenId];
        require(
            xfer.status == TransferStatus.Initiated ||
            xfer.status == TransferStatus.BuyerAccepted,
            "No active transfer"
        );

        xfer.status = TransferStatus.Rejected;

        emit TransferRejected(_tokenId, msg.sender, _reason);
    }

    // ──────────────────── Disputes ────────────────────

    /**
     * @notice Raise a dispute against a land parcel.
     */
    function raiseDispute(uint256 _tokenId, string memory _evidenceCID) external {
        require(parcels[_tokenId].tokenId != 0, "Land not registered");
        require(parcels[_tokenId].status != ParcelStatus.UnderDispute, "Already under dispute");

        parcels[_tokenId].status = ParcelStatus.UnderDispute;

        disputes[_tokenId].push(
            Dispute({
                tokenId: _tokenId,
                reporter: msg.sender,
                evidenceCID: _evidenceCID,
                resolved: false,
                raisedAt: block.timestamp,
                resolvedAt: 0
            })
        );

        emit DisputeRaised(_tokenId, msg.sender, _evidenceCID);
    }

    /**
     * @notice Registrar resolves a dispute.
     * @param _resolved true = dispute upheld (stays frozen), false = cleared.
     */
    function resolveDispute(uint256 _tokenId, bool _resolved)
        external
        onlyRole(REGISTRAR_ROLE)
    {
        require(parcels[_tokenId].status == ParcelStatus.UnderDispute, "Not under dispute");

        Dispute[] storage tokenDisputes = disputes[_tokenId];
        Dispute storage latest = tokenDisputes[tokenDisputes.length - 1];
        latest.resolved = true;
        latest.resolvedAt = block.timestamp;

        if (!_resolved) {
            parcels[_tokenId].status = ParcelStatus.Approved;
        }

        emit DisputeResolved(_tokenId, _resolved, msg.sender);
    }

    // ──────────────────── View Functions ────────────────────

    function getLandDetails(uint256 _tokenId) external view returns (LandParcel memory) {
        require(parcels[_tokenId].tokenId != 0, "Land not found");
        return parcels[_tokenId];
    }

    function getOwnershipHistory(uint256 _tokenId)
        external
        view
        returns (OwnershipRecord[] memory)
    {
        return ownershipHistory[_tokenId];
    }

    function getTransferDetails(uint256 _tokenId)
        external
        view
        returns (TransferRequest memory)
    {
        return transfers[_tokenId];
    }

    function getDisputes(uint256 _tokenId)
        external
        view
        returns (Dispute[] memory)
    {
        return disputes[_tokenId];
    }

    function getTotalParcels() external view returns (uint256) {
        return allTokenIds.length;
    }

    function getTokenIdBySurvey(string memory _surveyNumber)
        external
        view
        returns (uint256)
    {
        return surveyToToken[_surveyNumber];
    }

    // ──────────────────── Role Management ────────────────────

    function addRegistrar(address _registrar) external onlyRole(ADMIN_ROLE) {
        grantRole(REGISTRAR_ROLE, _registrar);
    }

    function removeRegistrar(address _registrar) external onlyRole(ADMIN_ROLE) {
        revokeRole(REGISTRAR_ROLE, _registrar);
    }

    // ──────────────────── Overrides ────────────────────

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Enumerable, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
