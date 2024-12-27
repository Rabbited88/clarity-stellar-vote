;; StellarVote Contract
;; A secure voting platform for decentralized elections

;; Constants
(define-constant contract-owner tx-sender)
(define-constant err-unauthorized (err u100))
(define-constant err-already-voted (err u101))
(define-constant err-election-ended (err u102))
(define-constant err-election-not-found (err u103))
(define-constant err-not-registered (err u104))

;; Data Variables
(define-map Elections 
    {election-id: uint} 
    {
        name: (string-ascii 100),
        description: (string-ascii 500),
        end-block: uint,
        status: (string-ascii 10)
    }
)

(define-map Candidates
    {election-id: uint, candidate-id: uint}
    {
        name: (string-ascii 100),
        vote-count: uint
    }
)

(define-map Voters
    {election-id: uint, voter: principal}
    {
        has-voted: bool,
        registered: bool
    }
)

(define-data-var election-nonce uint u0)

;; Private Functions
(define-private (is-election-active (election-id uint)) 
    (let (
        (election (unwrap! (map-get? Elections {election-id: election-id}) false))
        (current-status (get status election))
    )
    (is-eq current-status "active"))
)

(define-private (is-registered (election-id uint) (voter principal))
    (let (
        (voter-info (unwrap! (map-get? Voters {election-id: election-id, voter: voter}) false))
    )
    (get registered voter-info))
)

;; Public Functions
(define-public (create-election (name (string-ascii 100)) (description (string-ascii 500)) (end-block uint))
    (let (
        (election-id (var-get election-nonce))
    )
    (if (is-eq tx-sender contract-owner)
        (begin
            (map-set Elections 
                {election-id: election-id}
                {
                    name: name,
                    description: description,
                    end-block: end-block,
                    status: "active"
                }
            )
            (var-set election-nonce (+ election-id u1))
            (ok election-id)
        )
        err-unauthorized
    ))
)

(define-public (add-candidate (election-id uint) (candidate-id uint) (name (string-ascii 100)))
    (if (is-eq tx-sender contract-owner)
        (begin
            (map-set Candidates
                {election-id: election-id, candidate-id: candidate-id}
                {
                    name: name,
                    vote-count: u0
                }
            )
            (ok true)
        )
        err-unauthorized
    )
)

(define-public (register-voter (election-id uint) (voter principal))
    (if (is-eq tx-sender contract-owner)
        (begin
            (map-set Voters
                {election-id: election-id, voter: voter}
                {
                    has-voted: false,
                    registered: true
                }
            )
            (ok true)
        )
        err-unauthorized
    )
)

(define-public (cast-vote (election-id uint) (candidate-id uint))
    (let (
        (voter-info (unwrap! (map-get? Voters {election-id: election-id, voter: tx-sender}) err-not-registered))
        (candidate (unwrap! (map-get? Candidates {election-id: election-id, candidate-id: candidate-id}) err-election-not-found))
    )
    (asserts! (is-election-active election-id) err-election-ended)
    (asserts! (get registered voter-info) err-not-registered)
    (asserts! (not (get has-voted voter-info)) err-already-voted)
    
    (map-set Voters
        {election-id: election-id, voter: tx-sender}
        {
            has-voted: true,
            registered: true
        }
    )
    
    (map-set Candidates
        {election-id: election-id, candidate-id: candidate-id}
        {
            name: (get name candidate),
            vote-count: (+ (get vote-count candidate) u1)
        }
    )
    
    (ok true))
)

;; Read-only functions
(define-read-only (get-election-info (election-id uint))
    (map-get? Elections {election-id: election-id})
)

(define-read-only (get-candidate-info (election-id uint) (candidate-id uint))
    (map-get? Candidates {election-id: election-id, candidate-id: candidate-id})
)

(define-read-only (get-voter-info (election-id uint) (voter principal))
    (map-get? Voters {election-id: election-id, voter: voter})
)