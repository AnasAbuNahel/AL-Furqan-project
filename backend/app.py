from flask import Flask, request, jsonify, send_file
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy import func
from sqlalchemy import delete
import pandas as pd
from werkzeug.security import generate_password_hash, check_password_hash
from io import BytesIO
from functools import wraps
import jwt
import traceback
from datetime import datetime, timezone, timedelta
import jwt as pyjwt
import json
import pytz

app = Flask(__name__)
CORS(app, supports_credentials=True, origins=["https://al-furqan-project.vercel.app"])

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://db_al_furqan_user:tfWHkRJD5wfvLv9Bp4v7r5MHNpWwMYou@dpg-d1lpuier433s73e1te70-a/db_al_furqan'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_TOKEN_LOCATION'] = ['headers']  
app.config['JWT_SECRET_KEY'] = 'your-secret-key'
app.config["JWT_HEADER_NAME"] = "Authorization"
app.config["JWT_HEADER_TYPE"] = "Bearer"
app.config['SECRET_KEY'] = 'furqan-secret-key'

jwt_manager = JWTManager(app)
db = SQLAlchemy(app)

# ====== النماذج ======
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

    aids = db.relationship('Aid', backref='resident', lazy=True)

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
            'has_received_aid': self.has_received_aid
        }

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


# نموذج الأطفال
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


class Assistance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    child_id = db.Column(db.Integer, db.ForeignKey('child.id'), nullable=False)
    help_type = db.Column(db.String(100), nullable=False)
    other_help = db.Column(db.String(255), nullable=True)  
    date_added = db.Column(db.DateTime, default=datetime.utcnow)

    # علاقة مع جدول الأطفال
    child = db.relationship('Child', backref=db.backref('assistance', lazy=True))

    def __init__(self, child_id, help_type, other_help=None):
        self.child_id = child_id
        self.help_type = help_type
        self.other_help = other_help



# مسار عرض جميع الأطفال
@app.route('/api/children', methods=['GET'])
def get_all_children():
    children = Child.query.all()
    return jsonify([child.serialize() for child in children])

# مسار إضافة طفل جديد
@app.route('/api/children', methods=['POST'])
def add_child():
    data = request.get_json()
    name = data.get('name')
    id_number = data.get('id_number')
    birth_date = data.get('birth_date')
    age = data.get('age')
    phone = data.get('phone')
    gender = data.get('gender')
    benefit_type = data.get('benefit_type')
    benefit_count = data.get('benefit_count', 0)

    # تحقق من أن جميع الحقول المطلوبة موجودة
    if not all([name, id_number, birth_date, age, phone, gender, benefit_type]):
        return jsonify({"message": "Missing required fields!"}), 422

    new_child = Child(
        name=name,
        id_number=id_number,
        birth_date=birth_date,
        age=age,
        phone=phone,
        gender=gender,
        benefit_type=benefit_type,
        benefit_count=benefit_count
    )

    try:
        db.session.add(new_child)
        db.session.commit()
        return jsonify(new_child.serialize()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error occurred: {str(e)}"}), 500

# مسار تعديل بيانات طفل
@app.route('/api/children/<int:id>', methods=['PUT'])
def update_child(id):
    child = Child.query.get_or_404(id)
    data = request.get_json()

    # حفظ النسخة القديمة قبل التعديل
    old_data = child.serialize()

    child.name = data.get("name", child.name)
    child.id_number = data.get("id_number", child.id_number)
    child.birth_date = data.get("birth_date", child.birth_date)
    child.age = data.get("age", child.age)
    child.phone = data.get("phone", child.phone)
    child.gender = data.get("gender", child.gender)
    child.benefit_type = data.get("benefit_type", child.benefit_type)
    child.benefit_count = data.get("benefit_count", child.benefit_count)

    db.session.commit()

    # إضافة إشعار بعد التعديل
    action = f"تم تعديل بيانات الطفل {child.name} (ID: {child.id_number})"
    log_action(user_info={'user_id': 1, 'username': 'admin'}, action=action, target_name=child.name)

    return jsonify(child.serialize())

# مسار حذف بيانات طفل
@app.route('/api/children/<string:id_number>', methods=['DELETE'])
def delete_child(id_number):
    child = Child.query.filter_by(id_number=id_number).first()

    if not child:
        return jsonify({"message": "الطفل غير موجود!"}), 404

    db.session.delete(child)
    db.session.commit()

    # إضافة إشعار بعد الحذف
    action = f"تم حذف الطفل {child.name} (ID: {child.id_number})"
    log_action(user_info={'user_id': 1, 'username': 'admin'}, action=action, target_name=child.name)

    return jsonify({"message": "تم حذف السجل بنجاح!"}), 200


# مسار إضافة مساعدة
@app.route('/api/assistance', methods=['POST'])
def add_assistance():
    data = request.get_json()

    child_id = data.get('child_id')
    help_type = data.get('help_type')
    other_help = data.get('other_help')

    # تحقق من أن جميع الحقول المطلوبة موجودة
    if not all([child_id, help_type]):
        return jsonify({"message": "Missing required fields!"}), 422

    # إضافة المساعدة إلى قاعدة البيانات
    new_assistance = Assistance(
        child_id=child_id,
        help_type=help_type,
        other_help=other_help
    )

    try:
        # إضافة المساعدة
        db.session.add(new_assistance)
        
        # زيادة عدد مرات الاستفادة
        child = Child.query.get(child_id)
        child.benefit_count += 1

        # تسجيل المساعدة في قاعدة البيانات
        db.session.commit()

        # إضافة إشعار بعد إضافة المساعدة
        action = f"تم إضافة مساعدة من نوع {help_type} للطفل {child.name} (ID: {child.id_number})"
        log_action(user_info={'user_id': 1, 'username': 'admin'}, action=action, target_name=child.name)

        return jsonify({"message": "تم إضافة المساعدة بنجاح!"}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error occurred: {str(e)}"}), 500



# مسار عرض آخر مساعدة استفاد منها الطفل
@app.route('/api/children/<int:id>/last_assistance', methods=['GET'])
def get_last_assistance(id):
    child = Child.query.get_or_404(id)

    # الحصول على آخر مساعدة تم إضافتها للطفل
    last_assistance = Assistance.query.filter_by(child_id=id).order_by(Assistance.date_added.desc()).first()

    if not last_assistance:
        return jsonify({"message": "الطفل لم يستفد من أي مساعدة بعد"}), 404

    return jsonify({
        "child_id": child.id,
        "child_name": child.name,
        "last_assistance": {
            "help_type": last_assistance.help_type,
            "other_help": last_assistance.other_help,
            "date_added": last_assistance.date_added
        }
    })


# مسار لتصدير بيانات الأطفال إلى Excel
@app.route('/api/export_children', methods=['GET'])
def export_children():
    children = Child.query.all()
    children_data = [child.serialize() for child in children]
    df = pd.DataFrame(children_data)
    
    output = BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='Children')
        writer.save()
    
    output.seek(0)
    return send_file(output, mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", download_name="children.xlsx", as_attachment=True)

@app.route('/api/import_children', methods=['POST'])
def import_children():
    if 'file' not in request.files:
        return jsonify({'message': 'No file uploaded'}), 400

    file = request.files['file']
    imported_count = 0
    ignored_count = 0

    try:
        df = pd.read_excel(file)
        for _, row in df.iterrows():
            # تحقق من أن جميع الحقول موجودة
            if not all(pd.notnull(row[['name', 'id_number', 'birth_date', 'age', 'phone', 'gender', 'benefit_type']])):
                ignored_count += 1
                continue

            new_child = Child(
                name=row['name'],
                id_number=row['id_number'],
                birth_date=row['birth_date'],
                age=row['age'],
                phone=row['phone'],
                gender=row['gender'],
                benefit_type=row['benefit_type'],
                benefit_count=row['benefit_count']
            )
            db.session.add(new_child)
            imported_count += 1

        db.session.commit()

        # إضافة إشعار بعد الاستيراد
        action = f"تم استيراد {imported_count} طفلًا وتجاهل {ignored_count} بسبب بيانات غير مكتملة"
        log_action(user_info={'user_id': 1, 'username': 'admin'}, action=action) 

        return jsonify({'message': f'Data imported successfully! Imported: {imported_count}, Ignored: {ignored_count}'}), 201
    except Exception as e:
        return jsonify({'message': f'Error occurred during import: {str(e)}'}), 500



# ====== نموذج الإشعارات ======
class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, nullable=False)
    username = db.Column(db.String(80), nullable=False)
    action = db.Column(db.String(300), nullable=False)
    target_name = db.Column(db.String(100), nullable=True)
    timestamp = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(pytz.timezone('Asia/Gaza'))
    )

    def serialize(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.username,
            'action': self.action,
            'target_name': self.target_name,
            'timestamp': self.timestamp.isoformat()
        }

def log_action(user_info, action, target_name=None):
    notification = Notification(
        user_id=user_info['user_id'],
        username=user_info['username'],
        action=action,
        target_name=target_name
    )
    db.session.add(notification)
    db.session.commit()

# ====== تعريف النماذج الجديدة ======
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

with app.app_context():
    db.create_all()
    
    # إنشاء مستخدم مدير 
    if not User.query.filter_by(username='أبو بكر القدسي').first():
        admin_user = User(username='أبو بكر القدسي', role='admin')
        admin_user.set_password('GA-MH93')  
        admin_user.permissions = json.dumps({
            "can_view": True,
            "can_edit": True,
            "can_delete": True
        })
        db.session.add(admin_user)
        db.session.commit()


# ====== JWT ======
def generate_token(user):
    payload = {
        'user_id': user.id,
        'username': user.username,
        'role': user.role,
        'exp': datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    try:
        payload = pyjwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token مطلوب'}), 401
        token = token.replace("Bearer ", "")
        user_data = verify_token(token)
        if not user_data:
            return jsonify({'error': 'Token غير صالح أو منتهي'}), 401
        request.user = user_data
        return f(*args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not hasattr(request, 'user') or request.user['role'] != 'admin':
            return jsonify({'error': 'صلاحيات المدير فقط'}), 403
        return f(*args, **kwargs)
    return decorated

# ====== مسارات المستخدمين ======
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    if user and user.check_password(data['password']):
        token = generate_token(user)
        log_action({'user_id': user.id, 'username': user.username}, "تسجيل الدخول")
        return jsonify({
            'success': True,
            'token': token,
            'role': user.role,
            'permissions': json.loads(user.permissions or '{}')
        })
    return jsonify({'success': False, 'message': 'اسم المستخدم أو كلمة المرور غير صحيحة'})

@app.route('/api/user/update_credentials', methods=['PUT'])
@login_required
def update_credentials():
    user = User.query.get(request.user['user_id'])
    data = request.get_json()
    if 'username' in data:
        user.username = data['username']
    if 'password' in data:
        user.password = generate_password_hash(data['password'])
    db.session.commit()
    return jsonify({'message': 'تم تحديث البيانات بنجاح'})

@app.route('/api/user/update_permissions/<int:user_id>', methods=['PUT'])
@login_required
@admin_required
def update_permissions(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    user.permissions = json.dumps(data.get('permissions', {}))
    db.session.commit()
    log_action(request.user, "تحديث بيانات الحساب")
    return jsonify({'message': 'تم تحديث الصلاحيات بنجاح'})

# ====== إدارة المستفيدين ======
@app.route('/api/residents', methods=['GET'])
@login_required
def get_residents():
    residents = Resident.query.all()
    return jsonify([r.serialize() for r in residents])

@app.route('/api/residents', methods=['POST'])
@login_required
def add_resident():
    data = request.json
    existing = Resident.query.filter(
        (Resident.husband_id_number == data.get('husband_id_number')) |
        (Resident.wife_id_number == data.get('wife_id_number')) |
        (Resident.phone_number == data.get('phone_number'))
    ).first()
    if existing:
        return jsonify({'error': 'مستفيد بنفس البيانات موجود بالفعل'}), 400
    resident = Resident(**data)
    db.session.add(resident)
    db.session.commit()

    log_action(request.user, "أضاف مستفيد جديد", f"{resident.husband_name} / {resident.wife_name}")

    return jsonify({'message': 'تمت الإضافة بنجاح'})

@app.route('/api/residents/<int:resident_id>', methods=['PUT'])
@login_required
def update_resident(resident_id):
    resident = Resident.query.get_or_404(resident_id)
    for key, value in request.json.items():
        setattr(resident, key, value)
    db.session.commit()

    log_action(request.user, "حدث بيانات المستفيد", f"{resident.husband_name} / {resident.wife_name}")

    return jsonify({'message': 'تم التحديث بنجاح'})

@app.route('/api/residents/<int:resident_id>', methods=['DELETE'])
@login_required
def delete_resident(resident_id):
    resident = Resident.query.get_or_404(resident_id)
    name = f"{resident.husband_name} / {resident.wife_name}"
    db.session.delete(resident)
    db.session.commit()

    log_action(request.user, "حذف مستفيد", name)

    return jsonify({'message': 'تم الحذف بنجاح'})

@app.route('/api/residents/delete_all', methods=['DELETE'])
@login_required
@admin_required
def delete_all_residents():
    db.session.query(Resident).delete()
    db.session.commit()
    return jsonify({'message': 'تم حذف جميع المستفيدين'})

# ====== إدارة المساعدات ======
@app.route('/api/aids', methods=['GET', 'POST'])
@login_required
def manage_aids():
    if request.method == 'POST':
        data = request.json
        resident_id = data.get('resident_id')
        aid_type = data.get('aid_type')
        aid_date = data.get('date')

        resident = Resident.query.get(resident_id)
        if not resident:
            return jsonify({'error': 'المستفيد غير موجود'}), 404

        aid = Aid(resident_id=resident_id, aid_type=aid_type, date=aid_date)
        resident.has_received_aid = True

        db.session.add(aid)
        db.session.commit()

        log_action(request.user, f"اضافة مساعدة ({aid_type}) للمستفيد", resident.husband_name)

        return jsonify({'message': 'تمت إضافة المساعدة بنجاح'})

    aids = Aid.query.all()
    return jsonify([a.serialize() for a in aids])

@app.route('/api/aids/<int:aid_id>', methods=['PUT'])
@login_required
@admin_required
def update_aid(aid_id):
    aid = Aid.query.get_or_404(aid_id)
    for key, value in request.json.items():
        setattr(aid, key, value)
    db.session.commit()

    log_action(request.user, "حدث بيانات المساعدة", aid.resident.husband_name)

    return jsonify({'message': 'تم تحديث المساعدة بنجاح'})

@app.route('/api/aids/<int:aid_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_aid(aid_id):
    aid = Aid.query.get_or_404(aid_id)
    resident_name = aid.resident.husband_name
    db.session.delete(aid)

    aids_left = Aid.query.filter_by(resident_id=aid.resident_id).count()
    if aids_left <= 1:  
        resident = Resident.query.get(aid.resident_id)
        if resident:
            resident.has_received_aid = False

    db.session.commit()

    log_action(request.user, "حذف مساعدة", resident_name)

    return jsonify({'message': 'تم حذف المساعدة بنجاح'})

# ====== جلب الإشعارات ======

@app.route('/api/notifications', methods=['GET'])
@login_required
def get_notifications():
    week_ago = datetime.utcnow() - timedelta(days=7)

    stmt = delete(Notification).where(Notification.timestamp < week_ago)
    db.session.execute(stmt)
    db.session.commit()

    notifications = Notification.query.order_by(Notification.timestamp.desc()).limit(100).all()
    return jsonify([n.serialize() for n in notifications])

# ====== تحميل بيانات المستفيدين كملف Excel ======
@app.route('/api/export_residents', methods=['GET'])
@login_required
def export_residents():
    residents = Resident.query.all()
    data = [r.serialize() for r in residents]
    df = pd.DataFrame(data)
    output = BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
        df.to_excel(writer, index=False, sheet_name='Residents')
        writer.save()
    output.seek(0)
    log_action(request.user, "تصدير بيانات المستفيدين إلى Excel")
    return send_file(output, download_name="residents.xlsx", as_attachment=True)

@app.route('/api/residents/import', methods=['POST'])
@login_required
def import_excel():
    if 'file' not in request.files:
        return jsonify({'error': 'لم يتم إرسال ملف'}), 400

    file = request.files['file']

    def to_float_safe(value):
        try:
            if pd.isna(value):
                return None
            return float(value)
        except (ValueError, TypeError):
            return None

    def to_str_safe(value):
        if pd.isna(value):
            return None
        return str(value).strip()

    try:
        df = pd.read_excel(file, engine='openpyxl')

        field_map = {
            'اسم الزوج': 'husband_name',
            'رقم هوية الزوج': 'husband_id_number',
            'اسم الزوجة': 'wife_name',
            'رقم هوية الزوجة': 'wife_id_number',
            'رقم الهاتف': 'phone_number',
            'عدد الأفراد': 'num_family_members',
            'الإصابات': 'injuries',
            'الأمراض': 'diseases',
            'الضرر': 'damage_level',
            'المندوب': 'neighborhood',
            'ملاحظات': 'notes',
            'استلم مساعدة': 'has_received_aid'
        }

        df.rename(columns=field_map, inplace=True)
        allowed_fields = set(field_map.values())

        existing_ids = set(
            db.session.query(Resident.husband_id_number, Resident.wife_id_number).all()
        )
        existing_ids_flat = set()
        for h_id, w_id in existing_ids:
            if h_id:
                existing_ids_flat.add(str(h_id).strip())
            if w_id:
                existing_ids_flat.add(str(w_id).strip())

        count = 0
        skipped = 0

        for _, row in df.iterrows():
            record = {k: v for k, v in row.to_dict().items() if k in allowed_fields}

            record['husband_name'] = to_str_safe(record.get('husband_name'))
            record['wife_name'] = to_str_safe(record.get('wife_name'))
            record['injuries'] = to_str_safe(record.get('injuries'))
            record['diseases'] = to_str_safe(record.get('diseases'))
            record['damage_level'] = to_str_safe(record.get('damage_level'))
            record['neighborhood'] = to_str_safe(record.get('neighborhood'))
            record['notes'] = to_str_safe(record.get('notes'))

            record['husband_id_number'] = to_str_safe(record.get('husband_id_number'))
            record['wife_id_number'] = to_str_safe(record.get('wife_id_number'))

            record['phone_number'] = to_float_safe(record.get('phone_number'))
            record['num_family_members'] = to_float_safe(record.get('num_family_members'))

            if 'has_received_aid' in record:
                value = str(record['has_received_aid']).strip().lower()
                record['has_received_aid'] = value in ['نعم', 'yes', '1', 'true']

            h_id = record.get('husband_id_number') or ''
            w_id = record.get('wife_id_number') or ''

            if h_id in existing_ids_flat or w_id in existing_ids_flat:
                skipped += 1
                continue

            resident = Resident(**record)
            db.session.add(resident)
            count += 1

        db.session.commit()

        log_action(request.user, f"استورد ملف مستفيدين ({count} سجل، تم تجاهل {skipped} مكرر)")

        return jsonify({'message': f'تم استيراد {count} مستفيد بنجاح، تم تجاهل {skipped} سجل مكرر'})

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'حدث خطأ أثناء الاستيراد: {str(e)}'}), 500

from sqlalchemy import func


# ====== الاحصائيات ======
@app.route('/api/residents/stats', methods=['GET'])
def get_residents_stats():
    total_residents = db.session.query(func.count(Resident.id)).scalar()

    total_beneficiaries = db.session.query(func.count(Resident.id))\
        .filter(Resident.has_received_aid == True).scalar()

    total_non_beneficiaries = db.session.query(func.count(Resident.id))\
        .filter(Resident.has_received_aid == False).scalar()

    total_full_damage = db.session.query(func.count(Resident.id))\
        .filter(Resident.damage_level == 'هدم كلي').scalar()

    total_severe_partial_damage = db.session.query(func.count(Resident.id))\
        .filter(Resident.damage_level == 'جزئي بليغ').scalar()

    total_partial_damage = db.session.query(func.count(Resident.id))\
        .filter(Resident.damage_level == 'طفيف').scalar()

    total_no_damage = total_residents - (
        total_full_damage + total_severe_partial_damage + total_partial_damage
    )

    stats = {
        "total_residents": total_residents or 0,
        "total_aids": total_beneficiaries or 0,  
        "total_beneficiaries": total_beneficiaries or 0,
        "total_non_beneficiaries": total_non_beneficiaries or 0,
        "total_full_damage": total_full_damage or 0,
        "total_severe_partial_damage": total_severe_partial_damage or 0,
        "total_partial_damage": total_partial_damage or 0,
        "total_no_damage": total_no_damage or 0,
    }

    return jsonify(stats)

# إضافة مشرف (يُسمح فقط للمدير)
@app.route('/api/users', methods=['POST'])
@login_required
@admin_required
def create_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'يجب إدخال اسم المستخدم وكلمة المرور'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'اسم المستخدم مستخدم بالفعل'}), 400

    new_user = User(username=username, role='supervisor')
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    log_action(request.user, "إضافة مشرف جديد", username)

    return jsonify({
        'id': new_user.id,
        'username': new_user.username,
        'role': new_user.role
    }), 201

# جلب جميع المشرفين
@app.route('/api/supervisors', methods=['GET'])
@login_required
@admin_required
def get_supervisors():
    supervisors = User.query.filter_by(role='supervisor').all()
    return jsonify([
        {'id': s.id, 'username': s.username}
        for s in supervisors
    ])


# حذف مشرف (للمدير فقط)
@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_user(user_id):
    user = User.query.get_or_404(user_id)

    if user.role != 'supervisor':
        return jsonify({'error': 'لا يمكن حذف المدير أو مستخدم غير مشرف'}), 400

    username = user.username
    db.session.delete(user)
    db.session.commit()

    log_action(request.user, "حذف مشرف", username)

    return jsonify({'message': 'تم حذف المشرف بنجاح'})
    

# ====== مسارات API للواردات ======
@app.route('/api/imports', methods=['GET'])
@login_required
def list_imports():
    imports = Import.query.all()
    return jsonify([imp.serialize() for imp in imports])

@app.route('/api/imports', methods=['POST'])
@login_required
def add_import():
    data = request.get_json()
    new_import = Import(
        source=data['source'],
        name=data['name'],
        date=data['date'],
        type=data['type'],
        amount=float(data['amount'])
    )
    db.session.add(new_import)
    db.session.commit()
    log_action(request.user, f"إضافة وارد ({data['name']}) بمبلغ {data['amount']}")
    return jsonify(new_import.serialize()), 201

# ====== مسارات API للصادرات ======
@app.route('/api/exports', methods=['GET'])
@login_required
def list_exports():
    exports = Export.query.all()
    return jsonify([exp.serialize() for exp in exports])

@app.route('/api/exports', methods=['POST'])
@login_required
def add_export():
    data = request.get_json()
    new_export = Export(
        description=data['description'],
        amount=float(data['amount']),
        date=data['date']
    )
    db.session.add(new_export)
    db.session.commit()
    log_action(request.user, f"إضافة صادر ({data['description']}) بمبلغ {data['amount']}")
    return jsonify(new_export.serialize()), 201


# ====== نقطة بداية ======
if __name__ == '__main__':
    app.run(debug=True)
