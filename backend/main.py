from fastapi import FastAPI


#router include section
####################################################3
from backend.api.index_router import index_router




###################################################



app = FastAPI(title="NUS Hackathon Backend")
app.include_router(index_router)
