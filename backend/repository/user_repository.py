from sqlalchemy.orm import Session

from backend.models.user import User, UserRole


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_email(self, email: str) -> User | None:
        return self.db.query(User).filter(User.email == email).first()

    def get_by_id(self, user_id: str) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def create(
        self,
        email: str,
        first_name: str,
        last_name: str,
        hashed_password: str,
        role: UserRole = UserRole.USER_PATIENT,
    ) -> User:
        is_patient = role == UserRole.USER_PATIENT
        user = User(
            email=email,
            first_name=first_name,
            last_name=last_name,
            hashed_password=hashed_password,
            role=role,
            is_onboarded=not is_patient,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def email_exists(self, email: str) -> bool:
        return self.db.query(User.id).filter(User.email == email).first() is not None

    def complete_onboarding(self, user_id: str) -> User | None:
        user = self.get_by_id(user_id)
        if user is None:
            return None
        user.is_onboarded = True
        self.db.commit()
        self.db.refresh(user)
        return user
