import uuid
import hmac
import hashlib
import httpx
from loguru import logger
from app.core.config import settings


def get_headers():
    return {
        "Authorization": f"Bearer {settings.SQUAD_SECRET_KEY}",
        "Content-Type": "application/json",
    }


# ── Customer + Virtual Account ─────────────────────────────────

async def create_customer(
    user_id: str,
    full_name: str,
    phone: str,
    email: str,
) -> str:
    """
    Creates a Squad customer and returns the customer_id.
    Call this first before creating a virtual account.
    """
    first, *rest = full_name.split()
    last = " ".join(rest) if rest else first

    async with httpx.AsyncClient(timeout=30) as c:
        resp = await c.post(
            f"{settings.SQUAD_BASE_URL}/merchant/create-customer",
            headers=get_headers(),
            json={
                "first_name": first,
                "last_name": last,
                "mobile_number": phone,
                "email": email or f"{user_id[:8]}@kairo.ng",
                "customer_id": user_id,
            },
        )
    data = resp.json()
    logger.info(f"Squad create_customer response: {data}")
    if not data.get("success"):
        raise ValueError(f"Squad customer creation failed: {data.get('message')}")
    return data["data"]["customer_id"]


async def create_virtual_account(
    customer_id: str,
    display_name: str,
    phone: str,
    bvn: str = None,
) -> dict:
    """
    Creates a Squad virtual account for the customer.
    Returns account number and bank name.
    """
    payload = {
        "customer_identifier": customer_id,
        "display_name": display_name,
        "mobile_number": phone,
    }
    if bvn:
        payload["bvn"] = bvn

    async with httpx.AsyncClient(timeout=30) as c:
        resp = await c.post(
            f"{settings.SQUAD_BASE_URL}/virtual-account",
            headers=get_headers(),
            json=payload,
        )
    data = resp.json()
    logger.info(f"Squad create_virtual_account: {data}")
    if not data.get("success"):
        raise ValueError(f"Virtual account creation failed: {data.get('message')}")
    return {
        "virtual_account_no": data["data"]["virtual_account_number"],
        "bank_name": data["data"]["bank_name"],
    }


# ── Full wallet setup (create customer + virtual account) ──────

async def create_wallet(
    user_id: str,
    full_name: str,
    phone: str,
    email: str,
    bvn: str = None,
) -> dict:
    """
    Complete wallet setup: create Squad customer then virtual account.
    Returns everything needed to store in the users table.
    """
    customer_id = await create_customer(user_id, full_name, phone, email)
    account = await create_virtual_account(customer_id, full_name, phone, bvn)
    return {
        "squad_customer_id": customer_id,
        "virtual_account_no": account["virtual_account_no"],
        "virtual_account_bank": account["bank_name"],
    }


# ── Receiver Verification ──────────────────────────────────────

async def verify_receiver(account_number: str, bank_code: str) -> dict:
    """
    Verify a bank account before initiating a transfer.
    Returns account_name or raises ValueError.
    """
    async with httpx.AsyncClient(timeout=15) as c:
        resp = await c.post(
            f"{settings.SQUAD_BASE_URL}/payout/account/lookup",
            headers=get_headers(),
            json={"bank_code": bank_code, "account_number": account_number},
        )
    data = resp.json()
    logger.info(f"Squad verify_receiver: {data}")
    if data.get("success") and data["data"].get("account_name"):
        return {
            "verified": True,
            "account_name": data["data"]["account_name"],
            "account_number": account_number,
            "bank_code": bank_code,
        }
    raise ValueError(f"Account lookup failed: {data.get('message', 'Unknown')}")


# ── Initiate Transfer ──────────────────────────────────────────

async def initiate_transfer(
    amount_naira: float,
    account_number: str,
    bank_code: str,
    account_name: str,
    narration: str,
    user_id: str,
) -> dict:
    """
    Send money from KAIRO's Squad account to any bank account.
    Always call verify_receiver first and confirm with user.
    """
    reference = f"KAIRO-{user_id[:8]}-{uuid.uuid4().hex[:8]}"
    amount_kobo = int(amount_naira * 100)  # Squad expects kobo

    async with httpx.AsyncClient(timeout=30) as c:
        resp = await c.post(
            f"{settings.SQUAD_BASE_URL}/payout/initiate",
            headers=get_headers(),
            json={
                "transaction_reference": reference,
                "amount": amount_kobo,
                "bank_code": bank_code,
                "account_number": account_number,
                "account_name": account_name,
                "narration": narration,
                "currency_id": "NGN",
            },
        )
    data = resp.json()
    logger.info(f"Squad initiate_transfer: {data}")
    if not data.get("success"):
        raise ValueError(f"Transfer failed: {data.get('message')}")
    return {"reference": reference, "status": data["data"]["status"]}


# ── Loan Disbursement ──────────────────────────────────────────

async def disburse_loan(
    virtual_account_no: str,
    bank_code: str,
    account_name: str,
    amount_naira: float,
    loan_id: str,
) -> dict:
    """
    Disburse an approved loan directly to the user's virtual account.
    """
    reference = f"LOAN-{loan_id[:8]}-{uuid.uuid4().hex[:6]}"
    async with httpx.AsyncClient(timeout=30) as c:
        resp = await c.post(
            f"{settings.SQUAD_BASE_URL}/payout/initiate",
            headers=get_headers(),
            json={
                "transaction_reference": reference,
                "amount": int(amount_naira * 100),
                "bank_code": bank_code,
                "account_number": virtual_account_no,
                "account_name": account_name,
                "narration": f"KAIRO loan disbursement - {loan_id}",
                "currency_id": "NGN",
            },
        )
    data = resp.json()
    if not data.get("success"):
        raise ValueError(f"Loan disbursement failed: {data.get('message')}")
    return {"reference": reference, "status": data["data"]["status"]}


# ── Query Transactions ─────────────────────────────────────────

async def get_transactions(
    per_page: int = 20,
    page: int = 1,
    date_from: str = None,
    date_to: str = None,
) -> list:
    """
    Fetch transaction history from Squad.
    Used by: wallet screen, n8n trust scoring cron.
    """
    params = {"perPage": per_page, "page": page}
    if date_from:
        params["dateFrom"] = date_from
    if date_to:
        params["dateTo"] = date_to

    async with httpx.AsyncClient(timeout=15) as c:
        resp = await c.get(
            f"{settings.SQUAD_BASE_URL}/transaction/query",
            headers=get_headers(),
            params=params,
        )
    data = resp.json()
    return data.get("data", {}).get("transactions", [])


async def get_transaction_by_ref(reference: str) -> dict:
    """Fetch a single transaction detail by reference."""
    async with httpx.AsyncClient(timeout=15) as c:
        resp = await c.get(
            f"{settings.SQUAD_BASE_URL}/transaction/{reference}",
            headers=get_headers(),
        )
    return resp.json().get("data", {})


# ── Webhook Verification ───────────────────────────────────────

def verify_squad_webhook(body: bytes, signature: str) -> bool:
    """
    Verify the HMAC-SHA512 signature Squad sends with every webhook.
    Always call this before processing any webhook payload.
    """
    expected = hmac.new(
        settings.SQUAD_SECRET_KEY.encode(),
        body,
        hashlib.sha512, 
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


# ── BVN Verification ───────────────────────────────────────────

async def verify_bvn(bvn: str) -> dict:
    """
    Verify a BVN using Squad's lookup service.
    Returns the user's basic info if successful.
    """
    async with httpx.AsyncClient(timeout=15) as c:
        resp = await c.get(
            f"{settings.SQUAD_BASE_URL}/payout/bvn/lookup?bvn={bvn}",
            headers=get_headers(),
        )
    
    data = resp.json()
    logger.info(f"Squad verify_bvn response status {resp.status_code}: {data}")

    if resp.status_code != 200:
        msg = data.get("message", "Identity service temporarily unavailable")
        raise ValueError(msg)

    if data.get("success"):
        return data["data"]
    
    raise ValueError(data.get("message", "BVN verification failed"))