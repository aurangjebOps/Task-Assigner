"""
Lambda function for the Task Manager API.
Handles CRUD operations on a DynamoDB table via API Gateway HTTP API.

Routes:
  GET    /tasks       -> list all tasks
  POST   /tasks       -> create a new task
  GET    /tasks/{id}  -> get one task
  PUT    /tasks/{id}  -> update a task
  DELETE /tasks/{id}  -> delete a task
"""

import json
import uuid
import os
import boto3
from datetime import datetime, timezone

# --- Connect to DynamoDB ---
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["TABLE_NAME"])


def lambda_handler(event, context):
    """
    Main entry point. Routes based on HTTP method and path.
    """
    try:
        http = event["requestContext"]["http"]
        method = http["method"]
        path = event["rawPath"]

        # Handle CORS preflight
        if method == "OPTIONS":
            return response(200, {"message": "OK"})

        # Parse body if present
        body = {}
        if event.get("body"):
            body = json.loads(event["body"])

        # --- ROUTING ---
        # GET /tasks
        if method == "GET" and path == "/tasks":
            return list_tasks()

        # POST /tasks
        if method == "POST" and path == "/tasks":
            return create_task(body)

        # /tasks/{id}
        if path.startswith("/tasks/"):
            task_id = path.split("/")[-1]

            if method == "GET":
                return get_task(task_id)
            if method == "PUT":
                return update_task(task_id, body)
            if method == "DELETE":
                return delete_task(task_id)

        return response(404, {"error": "Route not found"})

    except Exception as e:
        return response(500, {"error": str(e)})


# --- Helper: build a CORS-enabled response ---
def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        "body": json.dumps(body),
    }


# --- CRUD Operations ---

def list_tasks():
    """Return all tasks from DynamoDB."""
    result = table.scan()
    tasks = result.get("Items", [])
    # Sort by created_at descending
    tasks.sort(key=lambda t: t.get("created_at", ""), reverse=True)
    return response(200, tasks)


def create_task(body):
    """Create a new task. Requires a 'title' field."""
    title = body.get("title", "").strip()
    if not title:
        return response(400, {"error": "Title is required"})

    task = {
        "id": str(uuid.uuid4()),
        "title": title,
        "description": body.get("description", ""),
        "status": "active",  # active or done
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    table.put_item(Item=task)
    return response(201, task)


def get_task(task_id):
    """Get a single task by ID."""
    result = table.get_item(Key={"id": task_id})
    task = result.get("Item")
    if not task:
        return response(404, {"error": "Task not found"})
    return response(200, task)


def update_task(task_id, body):
    """Update a task. Only updates provided fields."""
    # Check if task exists
    existing = table.get_item(Key={"id": task_id})
    if not existing.get("Item"):
        return response(404, {"error": "Task not found"})

    # Build update expression dynamically
    updates = {}
    expr_names = {}
    expr_values = {}

    if "title" in body:
        updates["#t"] = body["title"]
        expr_names["#t"] = "title"
        expr_values[":t"] = body["title"]

    if "description" in body:
        updates["#d"] = body["description"]
        expr_names["#d"] = "description"
        expr_values[":d"] = body["description"]

    if "status" in body:
        updates["#s"] = body["status"]
        expr_names["#s"] = "status"
        expr_values[":s"] = body["status"]

    # Toggle status if not provided
    if "status" not in body:
        current = existing["Item"].get("status", "active")
        new_status = "done" if current == "active" else "active"
        updates["#s"] = new_status
        expr_names["#s"] = "status"
        expr_values[":s"] = new_status

    if not updates:
        return response(400, {"error": "No fields to update"})

    set_clause = ", ".join(f"{k} = {k}" for k in updates)
    # Fix: use proper expression
    set_parts = []
    key_map = {"#t": ":t", "#d": ":d", "#s": ":s"}
    for name_key, val_key in key_map.items():
        if name_key in expr_names:
            set_parts.append(f"{name_key} = {val_key}")
    set_clause = ", ".join(set_parts)

    result = table.update_item(
        Key={"id": task_id},
        UpdateExpression=f"SET {set_clause}",
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
        ReturnValues="ALL_NEW",
    )
    return response(200, result["Attributes"])


def delete_task(task_id):
    """Delete a task by ID."""
    # Check if exists
    existing = table.get_item(Key={"id": task_id})
    if not existing.get("Item"):
        return response(404, {"error": "Task not found"})

    table.delete_item(Key={"id": task_id})
    return response(200, {"message": "Task deleted", "id": task_id})
