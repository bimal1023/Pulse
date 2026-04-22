from pydantic import BaseModel, field_validator

ALLOWED_ROLES = {"user", "assistant", "tool"}

class Message(BaseModel):
    role: str
    content: str

    @field_validator("role")
    def validate_role(cls, v):
        if v not in ALLOWED_ROLES:
            raise ValueError(f"Invalid role: {v}")
        return v

    @field_validator("content")
    def validate_content(cls, v):
        if not v.strip():
            raise ValueError("Message content cannot be empty")
        if len(v) > 10000:
            raise ValueError("Message too long (max 10000 characters)")
        return v.strip()

class AgentRequest(BaseModel):
    messages: list[Message]

    @field_validator("messages")
    def validate_messages(cls, v):
        if not v:
            raise ValueError("Messages list cannot be empty")
        if v[-1].role != "user":
            raise ValueError("Last message must be from the user")
        return v
