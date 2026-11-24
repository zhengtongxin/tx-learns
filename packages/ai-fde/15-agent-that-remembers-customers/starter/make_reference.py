# make_reference.py: run once by a person (Kumar), never by the agent.
# It makes reference.db, which the agent may only read.
import sqlite3

setup = sqlite3.connect("reference.db")
setup.execute("CREATE TABLE IF NOT EXISTS policies (id TEXT PRIMARY KEY, cover TEXT, limit_amt REAL)")
setup.execute("INSERT OR REPLACE INTO policies VALUES ('P003', 'trip cancellation and lost baggage', 2000)")
setup.commit()
setup.close()   # added: close the file before the agent opens it read-only
print("reference.db is ready")
