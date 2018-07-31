TRUNCATE TABLE events;

INSERT INTO events (data, time) VALUES
  ('{
    "type": "CreateAccount",
    "user_id": "cafebabe-cafe-babe-cafe-babecafebabe",
    "name": "Bobby Bowls",
    "email": "bobby@bowls.com"
  }', now() - INTERVAL '100 MINUTES'),

  ('{
    "type": "NameChange",
    "user_id": "cafebabe-cafe-babe-cafe-babecafebabe",
    "name": "Bobby Beans"
    }', now() - INTERVAL '90 MINUTES'),

  ('{
    "type": "EmailChange",
    "user_id": "cafebabe-cafe-babe-cafe-babecafebabe",
    "email": "bobby@beans.com"
    }', now() - INTERVAL '80 MINUTES'),

  ('{
    "type": "CreateAccount",
    "user_id": "deadc0de-dead-40de-8ead-c0dedeadc0de",
    "name": "Toaster",
    "email": "toaster@noodles.com"
  }', now() - INTERVAL '70 MINUTES'),

  ('{
    "type": "NameChange",
    "user_id": "deadc0de-dead-40de-8ead-c0dedeadc0de",
    "name": "Noodles",
    "email": "noodles@noodles.com"
  }', now() - INTERVAL '60 MINUTES')
;
