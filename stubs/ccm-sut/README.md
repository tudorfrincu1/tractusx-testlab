# CCM SUT Stub

Disposable stub that simulates an EDC connector for Certificate Management (CCM) TCK tests.

**This is a temporary test helper — delete when no longer needed.**

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v1/dsp/catalog/request` | DSP catalog with CCMAPI offer |
| POST | `/api/v1/dsp/negotiations/request` | Contract negotiation → agreement |
| GET | `/api/v1/dsp/negotiations/{id}` | Negotiation status (FINALIZED) |
| POST | `/management/v3/transferprocesses` | Initiate transfer |
| GET | `/management/v3/edrs/{id}/dataaddress` | EDR token + data endpoint |
| GET | `/companycertificate/{document_id}` | Certificate payload |
| POST | `/companycertificate/request` | Certificate request + delayed callback |
| POST | `/companycertificate/notification/receive` | Accept notifications |
| GET | `/health` | Health check |

## Run

```bash
cd stubs/ccm-sut
pip install fastapi uvicorn httpx
python app.py
```

Or with uvicorn directly:

```bash
uvicorn app:app --host 0.0.0.0 --port 8090 --reload
```

The stub runs on **port 8090**.

## Callback Behavior

When `/companycertificate/request` is called, the stub schedules a 2-second delayed POST to `{TESTLAB_CALLBACK_URL}/companycertificate/status` with:

```json
{"requestId": "<the_request_id>", "feedbackStatus": "APPROVED"}
```

Edit `TESTLAB_CALLBACK_URL` in `app.py` if your TestLab server runs on a different address.

## Config

`config.env` contains the variables the TestLab runner needs to connect to this stub.
