from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

# نموذج المستفيد
class Resident(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    husband_name = db.Column(db.String(100), nullable=True)
    husband_id_number = db.Column(db.String(20), nullable=True)
    wife_name = db.Column(db.String(100), nullable=True)
    wife_id_number = db.Column(db.String(20), nullable=True)
    phone_number = db.Column(db.String(20), nullable=True)
    num_family_members = db.Column(db.Integer, nullable=True)
    injuries = db.Column(db.String(200), nullable=True)
    diseases = db.Column(db.String(200), nullable=True)
    damage_level = db.Column(db.String(200), nullable=True)
    neighborhood = db.Column(db.String(200), nullable=True)
    notes = db.Column(db.String(300), nullable=True)
    has_received_aid = db.Column(db.Boolean, default=False)

    aids = db.relationship('Aid', backref='resident', lazy=True, cascade="all, delete-orphan")

    def serialize(self):
        return {
            'id': self.id,
            'husband_name': self.husband_name,
            'husband_id_number': self.husband_id_number,
            'wife_name': self.wife_name,
            'wife_id_number': self.wife_id_number,
            'phone_number': self.phone_number,
            'num_family_members': self.num_family_members,
            'injuries': self.injuries,
            'diseases': self.diseases,
            'damage_level': self.damage_level,
            'neighborhood': self.neighborhood,
            'notes': self.notes,
            'has_received_aid': self.has_received_aid,
            'aid_history': [aid.serialize() for aid in self.aids]
        }

# نموذج المستخدم (مشرف أو مدير)
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default="admin")
    permissions = db.Column(db.Text, nullable=True)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def set_password(self, password):
        self.password = generate_password_hash(password)

# نموذج المساعدة
class Aid(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    resident_id = db.Column(db.Integer, db.ForeignKey('resident.id'), nullable=False)
    aid_type = db.Column(db.String(100), nullable=False)
    date = db.Column(db.String(20), nullable=False)

    def serialize(self):
        return {
            'id': self.id,
            'resident_id': self.resident_id,
            'aid_type': self.aid_type,
            'date': self.date,
            'resident': {
                'husband_name': self.resident.husband_name,
                'husband_id_number': self.resident.husband_id_number
            }
        }

# نموذج الاشعارات
class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    username = db.Column(db.String(80), nullable=False)
    action = db.Column(db.String(300), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def serialize(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.username,
            'action': self.action,
            'timestamp': self.timestamp.isoformat()
        }

# نموذج الإيرادات (الواردات)
class Import(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    source = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    date = db.Column(db.String(20), nullable=False)
    type = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)

    def serialize(self):
        return {
            'id': self.id,
            'source': self.source,
            'name': self.name,
            'date': self.date,
            'type': self.type,
            'amount': self.amount
        }

# نموذج المصروفات (الصادرات)
class Export(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.String(20), nullable=False)

    def serialize(self):
        return {
            'id': self.id,
            'description': self.description,
            'amount': self.amount,
            'date': self.date
        }

# تسجيل إشعارات الأنشطة
def log_action(user_info, action):
    notification = Notification(
        user_id=user_info['user_id'],
        username=user_info['username'],
        action=f"{user_info['username']} قام بـ {action}"
    )
    db.session.add(notification)
    db.session.commit()


class Child(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    id_number = db.Column(db.String(50), nullable=False, unique=True)
    birth_date = db.Column(db.String(20), nullable=False)
    age = db.Column(db.Integer, nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    gender = db.Column(db.String(10), nullable=False)
    benefit_type = db.Column(db.String(100), nullable=False)
    benefit_count = db.Column(db.Integer, default=0)

    def serialize(self):
        return {
            'id': self.id,
            'name': self.name,
            'id_number': self.id_number,
            'birth_date': self.birth_date,
            'age': self.age,
            'phone': self.phone,
            'gender': self.gender,
            'benefit_type': self.benefit_type,
            'benefit_count': self.benefit_count
        }
