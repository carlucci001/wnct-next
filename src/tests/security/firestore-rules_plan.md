
// This file documents the security vulnerabilities found in firestore.rules and the plan to fix them.
// Since we cannot run the Firebase Emulator Suite in this environment, this serves as the "test plan".

/*
VULNERABILITY 1: Privilege Escalation via User Creation
-------------------------------------------------------
Current Rule:
  match /users/{userId} {
    allow create: if isAuthenticated() && request.auth.uid == userId;
  }

Exploit:
  A malicious user can register using the Client SDK but intercept the request or use a custom script
  to set their role to 'admin' during the initial document creation.

  Code:
    await setDoc(doc(db, 'users', auth.currentUser.uid), {
      email: 'attacker@example.com',
      role: 'admin', // Maliciously setting admin role
      status: 'active'
    });

  Since getUserRole() relies on reading this document, the attacker effectively becomes an admin.

Fix:
  Restrict the 'create' rule to only allow 'role' to be 'reader' (or force it to be missing/default).

  New Rule:
    allow create: if isAuthenticated() && request.auth.uid == userId
      && (!request.resource.data.keys().hasAny(['role']) || request.resource.data.role == 'reader')
      && (!request.resource.data.keys().hasAny(['status']) || request.resource.data.status == 'active');


VULNERABILITY 2: Impersonation and Bypass of Editorial Review
-------------------------------------------------------------
Current Rule:
  match /articles/{articleId} {
    allow create: if isWriter();
  }

Exploit:
  A user with 'contributor' or 'writer' role can create an article that:
  1. Is attributed to another user (e.g., "editor-in-chief@wnctimes.com").
  2. Is immediately 'published', bypassing the draft/review process.

  Code:
    await addDoc(collection(db, 'articles'), {
      title: "Fake News",
      author: "editor-in-chief@wnctimes.com", // Impersonation
      status: "published" // Bypassing review
    });

Fix:
  Enforce that 'author' matches the authenticated user's email.
  Enforce that 'status' is 'draft' for non-editors.

  New Rule:
    allow create: if isEditor() // Editors can do whatever
      || (isWriter()
          && request.resource.data.author == request.auth.token.email
          && request.resource.data.status == 'draft');

VULNERABILITY 3: Article Author Tampering
-----------------------------------------
Current Rule:
  match /articles/{articleId} {
    allow update: if isEditor()
      || (isWriter() && resource.data.author == request.auth.token.email);
  }

Exploit:
  A writer can update their own article but change the author field to someone else,
  effectively "planting" an article on another user.

Fix:
  Prevent modification of the 'author' field by writers.

  New Rule:
    allow update: if isEditor()
      || (isWriter()
          && resource.data.author == request.auth.token.email
          && request.resource.data.author == request.auth.token.email // Author cannot change
          && request.resource.data.status == resource.data.status // Status cannot change (writers submit, editors publish)
         );
*/
