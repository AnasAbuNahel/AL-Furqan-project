from app import app, db
from models import Resident, User

with app.app_context():
    db.drop_all()     # حذف جميع الجداول
    db.create_all()   # إنشاءها من جديد
    print("✅ تم تفريغ قاعدة البيانات وإنشاؤها من جديد.")
