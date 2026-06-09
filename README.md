# Astrology Report MVP

מערכת MVP פנימית להזנת נתוני מפת לידה מוכנים, שליפת פרשנות מטבלה אחת, והפקת דוח PDF בעברית.

## הרצה מקומית

1. התקנת תלויות:

```bash
npm install
```

2. יצירת קובץ `.env` לפי `.env.example` והגדרת PostgreSQL:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/astrology_report_mvp?schema=public"
```

3. יצירת טבלאות וטעינת דוגמאות:

```bash
npm run prisma:migrate
npm run prisma:seed
```

4. הרצת המערכת:

```bash
npm run dev
```

## לוגיקת הפרשנות

לכל כוכב מתבצעות שתי שליפות נפרדות מאותה טבלה:

- `type = house`, לפי `planet + house`
- `type = sign`, לפי `planet + sign`

אם אין התאמה מדויקת, המערכת מחפשת fallback כללי לפי `planet + type`.

## מה לא כלול ב-MVP

- חישוב מיקומי כוכבים.
- משתמשים והרשאות.
- תשלומים.
- אחסון PDF בענן.
