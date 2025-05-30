import sqlite3

DB_FILE = 'database.db'

# الأعمدة المطلوب إضافتها
new_columns = {
    'wife_name': 'TEXT',
    'wife_id': 'TEXT',
    'phone': 'TEXT',
    'diseases': 'TEXT',
    'injuries': 'TEXT',
    'damage_level': 'TEXT'
}

def column_exists(cursor, table_name, column_name):
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = [info[1] for info in cursor.fetchall()]
    return column_name in columns

def add_missing_columns():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    for column_name, column_type in new_columns.items():
        if not column_exists(cursor, 'residents', column_name):
            print(f"➕ Adding column: {column_name}")
            cursor.execute(f"ALTER TABLE residents ADD COLUMN {column_name} {column_type}")
        else:
            print(f"✅ Column already exists: {column_name}")

    conn.commit()
    conn.close()
    print("🎉 All required columns are now in the table.")

if __name__ == '__main__':
    add_missing_columns()
