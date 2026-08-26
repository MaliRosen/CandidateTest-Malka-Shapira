# Requests Search & Filter

Full-stack feature adding DB-level search, filter, sort, and pagination to an existing ASP.NET Core API, with a complete Angular frontend.

---

## הרצת Backend

```bash
dotnet run --project src/Requests.Api
```

API זמין ב-`http://localhost:5000`.

---

## הרצת Frontend

```bash
cd frontend
npm install
ng serve
```

Frontend זמין ב-`http://localhost:4200`.

---

## הרצת בדיקות

```bash
dotnet test
```

הבדיקות מכסות את שכבת ה-Service: סינון לפי כל פרמטר בנפרד, שילוב פילטרים, הרשאות Admin מול RegularUser, מיון, ו-pagination invariants. הבדיקות רצות in-memory ואינן דורשות DB.

---

## טכנולוגיות שנבחרו ומדוע

| טכנולוגיה | סיבה |
|---|---|
| **ASP.NET Core 8** | הפלטפורמה הקיימת בפרויקט — אין סיבה לשנות |
| **EF Core + IQueryable** | מאפשר בניית שאילתות SQL דינמיות בלי לטעון נתונים לזיכרון |
| **EF Core InMemory** | פשוט לפיתוח ולבדיקות, ניתן להחלפה ב-SQL Server בפרודקשן |
| **Angular 17 (NgModule)** | Framework קיים בפרויקט; NgModule (לא standalone) שומר על עקביות עם הקוד הקיים |
| **ReactiveFormsModule** | מאפשר debounce ישירות על ה-FormControl בלי קוד נוסף |
| **Azure Service Bus** | Managed messaging עם Topics/Subscriptions ו-Dead Letter Queue — מתאים לארכיטקטורת Microservices עתידית |

---

## הנחות שבוצעו

- **אימות משתמש** — זיהוי דרך headers (`X-User-Id`, `X-Is-Admin`) בלבד. בפרודקשן יש להחליף ב-JWT / OAuth2.
- **Admin flag** — `X-Is-Admin: true` מוענק ללא אימות. בפרודקשן הרשאות אדמין צריכות לנבוע מטוקן חתום.
- **Frontend credentials** — `userId = 1`, `isAdmin = true` hard-coded ב-`AppComponent` לצורך demo. בפרודקשן יוזנו מ-auth context.
- **DB** — EF Core InMemory. ה-IQueryable pipeline תוכנן לעבוד ללא שינוי מול SQL Server.
- **CORS** — מדיניות פתוחה ל-`localhost:4200` בלבד, מתאים לפיתוח מקומי.

---

## החלטה טכנית: IQueryable pipeline במקום סינון in-memory

### החלופות

**חלופה א׳ — סינון in-memory (הגישה הקיימת לפני הפיצ'ר):**
```csharp
var all = await _db.Requests.ToListAsync(); // טוען הכל לזיכרון
return all.Where(r => r.Status == status).ToList();
```

**חלופה ב׳ — IQueryable pipeline (מה שנבחר):**
```csharp
var query = _db.Requests.AsQueryable();
if (status != null) query = query.Where(r => status.Contains(r.Status));
var total = await query.CountAsync();
var items = await query.Skip(...).Take(...).ToListAsync();
```

### מדוע נבחרה חלופה ב׳

- **ביצועים** — עם מיליוני רשומות, טעינת הכל לזיכרון רק כדי להחזיר 20 שורות בזבזנית. ה-IQueryable מתרגם לשאילתת SQL אחת שמחזירה רק מה שנדרש.
- **זיכרון** — in-memory סינון עלול לגרום ל-OOM תחת עומס. IQueryable לא טוען כלום לפני הסינון.
- **TotalCount נכון** — עם IQueryable מריצים `CountAsync()` לפני ה-`Skip/Take`, כך ש-`totalCount` מייצג את כל הרשומות התואמות ולא רק את הדף הנוכחי.
- **הידלדלות הדרגתית** — הגישה הקיימת עובדת עם 100 רשומות; עם 100,000 היא מתחילה להאט. עם IQueryable הביצועים קבועים ללא קשר לגודל הטבלה.

**הפשרה:** IQueryable מייצר תלות ב-EF Core. הפתרון — `FakeRequestRepository` בבדיקות מממש את אותה לוגיקה in-memory, כך שהבדיקות נשארות מהירות ומשמעותיות בלי DB אמיתי.

---

## מה לא הספקתי ואיך הייתי ממשיכה

### לא הוספתי
- **בדיקות Integration ל-Repository** — הבדיקות הקיימות הן unit tests ל-Service בלבד. בדיקות integration אמיתיות מול EF Core עם DB בזיכרון (לא `FakeRepository`) היו מגבירות את הביטחון שה-IQueryable pipeline מתורגם ל-SQL נכון.
- **אימות אמיתי** — ה-`X-User-Id`/`X-Is-Admin` headers הם placeholder. בפרודקשן יש להוסיף JWT middleware עם claims.
- **Angular unit tests** — קומפוננטות Angular נוצרו ללא `.spec.ts` מלא. היה מוסיף בדיקות ל-`SearchFilterComponent` (debounce) ול-`RequestsTableComponent` (sort toggle logic).
- **Error handling ב-Frontend** — כרגע מוצגת הודעת שגיאה גנרית. בפרודקשן היה מטפל בקודי שגיאה ספציפיים (401, 403, 400 עם validation details).
- **Outbox Pattern** — תוכנן ב-`design.md` אך לא מומש. זה הצעד הבא לקראת ארכיטקטורת Microservices אמינה.

### איך הייתי ממשיכה
1. הוספת JWT authentication middleware לשכבת ה-API
2. מימוש `OutboxMessages` table + background publisher ב-`RequestsService`
3. הוספת בדיקות integration עם `WebApplicationFactory` + EF Core InMemory
4. Dockerization של ה-API לצורך פריסה ב-Azure Container Apps

---

## API — Query Parameters

`GET /api/requests/search`

| Parameter | Type | Default | Description |
|---|---|---|---|
| `requestNumber` | `string` | — | Partial match (case-insensitive) |
| `status` | `int[]` | — | `1`=New, `2`=InProgress, `3`=Completed, `4`=Cancelled |
| `requestType` | `int[]` | — | `1`=General, `2`=Legal, `3`=Payment, `4`=Appeal |
| `createdFrom` | `DateTime` | — | `CreatedAt >= createdFrom` |
| `createdTo` | `DateTime` | — | `CreatedAt <= createdTo` |
| `sortBy` | `string` | `CreatedAt` | `Id`, `RequestNumber`, `Status`, `RequestType`, `CreatedAt`, `OwnerId` |
| `sortDirection` | `string` | `desc` | `asc` או `desc` |
| `page` | `int` | `1` | מינימום 1 |
| `pageSize` | `int` | `20` | מינימום 1, מקסימום 200 |

## Headers

| Header | תיאור |
|---|---|
| `X-User-Id` | חובה. מזהה המשתמש המבצע את הבקשה |
| `X-Is-Admin` | אופציונלי. `true` = רואה את כל הבקשות |

---

## תרשימי Architecture + Cloud

תרשימים מפורטים של ארכיטקטורת Microservices ופריסת Azure נמצאים ב-**`.kiro/specs/requests-search-and-filter/design.md`**:

- **חלק ב׳**: מפת Microservices + Outbox Pattern לתקשורת אמינה
- **חלק ג׳**: סקיצת פריסה ב-Azure (Container Apps, Service Bus, SQL Database, Application Insights)
