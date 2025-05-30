from werkzeug.security import generate_password_hash
from app import db, app, User  # تأكد من استيراد db و app و User من ملف app.py
import sys

def create_user(username, password, role):
    """دالة لإنشاء مستخدم جديد"""
    # إنشاء كلمة مرور مشفرة
    hashed_password = generate_password_hash(password)
    # إنشاء الكائن
    user = User(username=username, password=hashed_password, role=role)
    db.session.add(user)
    db.session.commit()
    print(f"تم إنشاء المستخدم {username} بنجاح مع الدور {role}")

def get_user_input():
    """دالة لاستقبال المدخلات من المستخدم لإنشاء الحساب"""
    # استلام المدخلات
    username = input("أدخل اسم المستخدم: ")
    password = input("أدخل كلمة المرور: ")
    role = input("أدخل الدور (admin أو supervisor): ").lower()

    # التحقق من أن الدور صحيح
    if role not in ['admin', 'supervisor']:
        print("الدور غير صحيح. يجب أن يكون 'admin' أو 'supervisor'.")
        sys.exit(1)

    # إنشاء المستخدم
    create_user(username, password, role)

if __name__ == '__main__':
    # التأكد من أن السكربت يعمل في بيئة Flask بشكل صحيح
    with app.app_context():  # التأكد من أن السكربت يعمل في بيئة Flask
        get_user_input()
        print("تم إضافة المستخدم بنجاح!")
