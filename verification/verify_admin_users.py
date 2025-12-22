from playwright.sync_api import Page, expect, sync_playwright

def verify_admin_users_page(page: Page):
    # Navigate to the admin users page
    page.goto("http://localhost:3000/admin/users")

    # Verify the page title
    expect(page.get_by_text("User Management")).to_be_visible()

    # Verify the table headers
    expect(page.get_by_text("User", exact=True)).to_be_visible()
    expect(page.get_by_text("Role", exact=True)).to_be_visible()
    expect(page.get_by_text("Status", exact=True)).to_be_visible()
    expect(page.get_by_text("Actions", exact=True)).to_be_visible()

    # Verify the mock users are present
    expect(page.get_by_text("Admin User")).to_be_visible()
    expect(page.get_by_text("Editor User")).to_be_visible()
    expect(page.get_by_text("Blocked User")).to_be_visible()

    # Verify role dropdown exists
    expect(page.get_by_role("combobox").first).to_be_visible()

    # Verify block/unblock buttons
    expect(page.get_by_role("button", name="Block").first).to_be_visible()
    expect(page.get_by_role("button", name="Unblock").first).to_be_visible()

    # Take a screenshot
    page.screenshot(path="/home/jules/verification/admin_users_page.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_admin_users_page(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
