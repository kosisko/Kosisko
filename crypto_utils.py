from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes
from cryptography.exceptions import InvalidSignature
import base64

class EmailSigner:
    @staticmethod
    def generate_key_pair():
        private_key = ec.generate_private_key(ec.SECP384R1())
        public_key = private_key.public_key()
        return private_key, public_key

    @staticmethod
    def sign_message(private_key, message: str) -> str:
        signature = private_key.sign(
            message.encode('utf-8'),
            ec.ECDSA(hashes.SHA384())
        )
        return base64.b64encode(signature).decode('utf-8')

    @staticmethod
    def verify_signature(public_key, message: str, signature_b64: str) -> bool:
        try:
            signature = base64.b64decode(signature_b64.encode('utf-8'))
            public_key.verify(
                signature,
                message.encode('utf-8'),
                ec.ECDSA(hashes.SHA384())
            )
            return True
        except InvalidSignature:
            return False
