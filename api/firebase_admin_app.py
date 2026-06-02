import json
import os

import firebase_admin
from firebase_admin import auth, credentials, firestore, storage


def _init() -> None:
    if firebase_admin._apps:
        return
    cred = credentials.Certificate(json.loads(os.environ["FIREBASE_KEY"]))
    firebase_admin.initialize_app(cred, {"storageBucket": "auto-producer.firebasestorage.app"})


def verify_token(id_token: str) -> str:
    _init()
    return auth.verify_id_token(id_token)["uid"]


def get_firestore():
    _init()
    return firestore.client()


def get_bucket():
    _init()
    return storage.bucket()
