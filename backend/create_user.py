from app import app, db, User, Tenant
from werkzeug.security import generate_password_hash

def list_all_users():
    users = User.query.all()
    if not users:
        print("لا توجد حسابات حالياً.")
    else:
        print("\n📋 قائمة جميع الحسابات:")
        for u in users:
            tenant = Tenant.query.get(u.tenant_id)
            print(f"- اسم المستخدم: {u.username}, الدور: {u.role}, الجهة: {tenant.name if tenant else 'غير موجودة'}")

def delete_user():
    username_to_delete = input("أدخل اسم المستخدم الذي تريد حذفه (أو اتركه فارغاً للعودة): ").strip()
    if not username_to_delete:
        return
    user = User.query.filter_by(username=username_to_delete).first()
    if not user:
        print(f"❌ المستخدم '{username_to_delete}' غير موجود.")
    else:
        confirm = input(f"هل أنت متأكد من حذف المستخدم '{username_to_delete}'؟ (y/n): ").strip().lower()
        if confirm == 'y':
            db.session.delete(user)
            db.session.commit()
            print(f"✅ تم حذف المستخدم '{username_to_delete}'.")
        else:
            print("تم إلغاء عملية الحذف.")

def create_tenant_with_admin():
    # 1. إدخال بيانات الجهة
    tenant_name = input("أدخل اسم الجهة: ").strip()
    tenant_slug = input("أدخل slug (معرّف فريد بالإنجليزية): ").strip()

    # 2. إنشاء الجهة (Tenant)
    new_tenant = Tenant(name=tenant_name, slug=tenant_slug)
    db.session.add(new_tenant)
    db.session.commit()
    print(f"✅ تم إنشاء الجهة '{tenant_name}' بنجاح (ID={new_tenant.id})")

    # 3. إدخال بيانات المدير
    admin_username = input(f"أدخل اسم المستخدم للمدير في '{tenant_name}': ").strip()
    admin_password = input(f"أدخل كلمة مرور المدير في '{tenant_name}': ").strip()

    # 4. إنشاء المدير
    hashed_pw = generate_password_hash(admin_password)
    new_user = User(username=admin_username, password=hashed_pw, role="admin", tenant_id=new_tenant.id)
    db.session.add(new_user)
    db.session.commit()
    print(f"✅ تم إنشاء مدير '{admin_username}' للجهة '{tenant_name}'\n")


def main():
    while True:
        print("\nاختر خيارًا:")
        print("1. عرض جميع الحسابات")
        print("2. حذف حساب مستخدم")
        print("3. إنشاء جهة جديدة مع مدير")
        print("4. خروج")

        choice = input("أدخل رقم الخيار: ").strip()

        if choice == "1":
            list_all_users()
        elif choice == "2":
            delete_user()
        elif choice == "3":
            create_tenant_with_admin()
        elif choice == "4":
            print("وداعًا!")
            break
        else:
            print("خيار غير صالح، حاول مرة أخرى.")

if __name__ == "__main__":
    with app.app_context():
        main()
