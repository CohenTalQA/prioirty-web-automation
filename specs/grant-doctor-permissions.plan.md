# Grant Doctor Permissions Flow — Priority Web

## Application Overview

Priority ERP web client (Hebrew, RTL) at BASE_URL from .env. An admin user (antone_a) logs in, dismisses startup popups, and runs the procedure "עדכון קבוצת הרשאות למשתמש" via the menu-search magnifier (#searchbottomHeader, findEntity()) to assign the "doctor" permissions group to the provider user (masri_ah). Key UI details discovered: login form is GWT-based with unlabeled inputs; after login up to three popups can appear (license/new-messages message dialog with אישור/ביטול, "חידושים" announcements dialog with "לא תודה", and a language-selection popup with עברית + אישור); the magnifier opens a "חיפוש בתפריט" dialog (#PriModalDialog) with a search field (input.TextBox_SearchFor), a "חיפוש" button, and a "הפעלה" run button; the procedure opens a "קליטת פרמטרים" dialog with משתמש and קבוצה חדשה fields (may be pre-filled from a previous run); completion shows dialog #pui-common-message-dialog titled "עדכון קבוצת הרשאות למשתמש" with an אישור button. Useful keyboard shortcuts (from docs/25-keys_and_functions_mac.pdf): F12/Ctrl+F12 descend to child screen, F5/Shift+F5 pick child screen, Tab/Shift+Tab move between fields, Ctrl+F3 search value in field, F8 drill-down pick, Enter select, Esc exit.

## Test Scenarios

### 1. Admin grants doctor permissions

**Seed:** `tests/seed.spec.ts`

#### 1.1. Login as admin and dismiss startup popups

**File:** `tests/sanity/03-dismiss-popups.spec.ts`

**Steps:**
  1. Navigate to BASE_URL and wait for the login form (username field, password field, כניסה button; allow up to 60s for the GWT client to boot).
    - expect: Login form is visible with שם משתמש, סיסמה, כניסה and שכחת סיסמה? elements.
  2. Fill APP_USERNAME and APP_PASSWORD from .env and click כניסה. Never log the password value.
    - expect: Login succeeds and the dashboard begins loading (page title contains the environment name and username).
  3. If a blocking message dialog appears (e.g. license / בדיקת הודעות חדשות), dismiss it via its אישור or ביטול button. This dialog intercepts clicks on other popups, so handle it first.
    - expect: The message dialog closes.
  4. If the חידושים (announcements / aiERP) dialog appears, click the "לא תודה" button.
    - expect: The announcements dialog closes.
  5. If the language selection popup (שפה Language) appears, verify עברית is selected in the combobox and click אישור.
    - expect: The language popup closes.
    - expect: The dashboard is fully visible: header with global search, main menu bar, and קיצורי הדרך שלי portlet.
  6. Assert the logged-in username antone_a is shown in the header.
    - expect: Header shows antone_a and no dialog overlays remain.

#### 1.2. Grant doctor permission group to provider user

**File:** `tests/sanity/04-grant-doctor-permissions.spec.ts`

**Steps:**
  1. Starting from a clean dashboard (previous test's state: logged in as antone_a, popups dismissed), click the magnifier icon #searchbottomHeader (onclick findEntity()) in the header.
    - expect: A "חיפוש בתפריט" dialog (#PriModalDialog) opens with a search textbox (input.TextBox_SearchFor), a חיפוש button, and הפעלה / ביטול / אפשרויות נוספות / עזרה buttons.
  2. Type "עדכון קבוצת הרשאות למשתמש" into the search field and click the חיפוש button.
    - expect: A result row with the exact text "עדכון קבוצת הרשאות למשתמש" appears in the dialog.
  3. Click the הפעלה button to run the procedure.
    - expect: A "קליטת פרמטרים" dialog opens describing the program, with fields משתמש and קבוצה חדשה (each with a disabled "= שווה ל-" comparator), a נקה button, and אישור / ביטול / עזרה buttons.
    - expect: Note: fields may be pre-filled with values from a previous run — always set them explicitly.
  4. Clear the משתמש field and enter the PROVIDER value from .env (masri_ah). If a lookup list opens, pick the matching user.
    - expect: The משתמש field contains masri_ah.
  5. Clear the קבוצה חדשה field and enter "doctor".
    - expect: The קבוצה חדשה field contains doctor.
  6. Click אישור in the קליטת פרמטרים dialog.
    - expect: The parameters dialog closes and the procedure runs (may take several seconds).
  7. Wait for the completion dialog #pui-common-message-dialog titled "עדכון קבוצת הרשאות למשתמש".
    - expect: The dialog reports success (e.g. "המשתמש וכרטיס העובד נוצרו בהצלחה" or an equivalent permission-group-updated message).
  8. Click the אישור button inside #pui-common-message-dialog (scope the locator to the dialog — the name אישור is not unique on the page).
    - expect: The completion dialog closes.
  9. Close the still-open "חיפוש בתפריט" dialog with its ביטול button.
    - expect: No modal dialogs remain and the dashboard is usable.

#### 1.3. Negative: procedure guards

**File:** `tests/sanity/05-permission-procedure-guards.spec.ts`

**Steps:**
  1. Open the menu search via #searchbottomHeader and search for a nonsense term (e.g. "פרוצדורה שלא קיימת"), then click חיפוש.
    - expect: No result row is shown and הפעלה does not open a procedure.
  2. Search and run "עדכון קבוצת הרשאות למשתמש", then in קליטת פרמטרים click נקה and then אישור with an empty משתמש field.
    - expect: The procedure does not report success; a validation or error message is shown (procedure allows only one user per run and requires a user).
  3. Run the procedure with משתמש set to the current logged-in admin (antone_a) and קבוצה חדשה set to doctor, then click אישור.
    - expect: An error is shown — per the procedure notes, a user cannot change their own permission group.
  4. Dismiss any dialogs with ביטול / אישור to leave the dashboard clean.
    - expect: No modal dialogs remain open.
