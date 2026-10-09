#
#
#
 Idhr jo bhi ARN add kr rkha hun...uske jagah apne ARN add krna 

 
#
#
#
# STEP 1: Create DynamoDB Table
# ══════════════════════════════════════════════════════════════
#
# 1. Go to: https://console.aws.amazon.com/dynamodb
# 2. Click "Create table"
# 3. Table name:  app-tasks
# 4. Partition key:  id    (type: String)
# 5. Table settings → "Capacity mode" → Select "On-demand"
#    (this is now a direct dropdown — no "Customize settings" button)
# 6. Click "Create table"
# 7. Wait until Status = "Active" (about 10 seconds)
# 8. Click on "app-tasks" table name
# 9. In the "Overview" tab, scroll down to "Additional identifiers"
#    COPY the Table ARN:
#    arn:aws:dynamodb:us-east-1:123456789012:table/app-tasks
#    (save this — you need it in Step 2)
#
#  

# ══════════════════════════════════════════════════════════════
# STEP 2: Create IAM Role for Lambda
# ══════════════════════════════════════════════════════════════
#
# 1. Go to: https://console.aws.amazon.com/iam
# 2. Left sidebar → "Roles" → "Create role"
# 3. Trusted entity type: "AWS service"
# 4. Use case: Search for "Lambda" → Select "Lambda"
#    (the use case dropdown now has a search box)
# 5. Click "Next"
# 6. Search box: type "AWSLambdaBasicExecutionRole"
#    ✓ Check the box for AWSLambdaBasicExecutionRole
# 7. Click "Next"
# 8. Role name:  task-manager-lambda-role
# 9. Click "Create role"
#
# --- Now add DynamoDB permission ---
# 10. Click on "task-manager-lambda-role" in the list
# 11. "Add permissions" → "Create inline policy"
# 12. Click "JSON" tab
# 13. DELETE everything, paste this:
#
# {
#     "Version": "2012-10-17",
#     "Statement": [{
#         "Effect": "Allow",
#         "Action": [
#             "dynamodb:GetItem",
#             "dynamodb:PutItem",
#             "dynamodb:UpdateItem",
#             "dynamodb:DeleteItem",
#             "dynamodb:Scan"
#         ],
#         "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/app-tasks"
#     }]
# }
#
#     Replace "123456789012" with your AWS Account ID
#     (find it: top-right corner → click your name → "Account")
#
# 14. Click "Next"
# 15. Policy name:  DynamoDBAccess
# 16. Click "Create policy"
# 17. Go back to "Roles" → click "task-manager-lambda-role"
#     COPY the Role ARN (shown at the top of the role details page):
#     arn:aws:iam::123456789012:role/task-manager-lambda-role
#     (save this — you need it in Step 3)

# ══════════════════════════════════════════════════════════════
# STEP 3: Create Lambda Function
# ══════════════════════════════════════════════════════════════
#
# --- Create the ZIP file first ---


HUmaraa jo bhi backend folder ke andr ka file hai uska ek ZIP file bnana pdega

Backend folder ko hi compress mt krdena

# --- Now create the function ---
# 1. Go to: https://console.aws.amazon.com/lambda
# 2. Click "Create function"
# 3. Select "Author from scratch"
# 4. Function name:  task-manager-api
# 5. Runtime:  Python 3.14
# 6. Architecture:  x86_64
# 7. "Change default execution role" → "Use an existing role"
#    → Select: task-manager-lambda-role
# 8. Click "Create function"
#
# --- Upload the code ---
# 9. In the "Code" tab, find "Code source" section
# 10. Click "Upload from" → ".zip file"
# 11. Click "Upload" → select /tmp/lambda_function.zip
# 12. Click "Save"
#
# 
# --- Set environment variable ---
# 13. Click "Configuration" tab → "Environment variables" → "Edit"
# 14. Click "Add environment variable"
#     Key:    TABLE_NAME
#     Value:  app-tasks
# 15. Click "Save"
#
# --- Copy the function ARN ---
# 16. At the top of the page, copy the ARN:
#     arn:aws:lambda:us-east-1:123456789012:function:task-manager-api
#     (save this — you need it in Step 4)

# ══════════════════════════════════════════════════════════════
# STEP 4: Create API Gateway HTTP API
# ══════════════════════════════════════════════════════════════
#
# 1. Go to: https://console.aws.amazon.com/apigateway
# 2. Under "HTTP API" section, click "Build"
# 3. "Add integration" → Choose "Lambda"
#    → Select: task-manager-api
# 4. API name:  task-manager-api
# 5. Click "Next"
# 6. "Configure routes" → Click "Add route"
#     Method:  ANY
#     Resource path:  /tasks
#     Integration target:  task-manager-api
# 7. Click "Add route" again
#     Method:  ANY
#     Resource path:  /tasks/{proxy+}
#     Integration target:  task-manager-api
# 8. Click "Next" → "Next" → "Create"
#

# --- Copy the API URL ---
# 9. At the top, copy the Invoke URL:
#     https://abc123xyz.execute-api.us-east-1.amazonaws.com
#     (save this — you need it in Step 8)

# ══════════════════════════════════════════════════════════════
# STEP 5: Allow API Gateway to Invoke Lambda
# ══════════════════════════════════════════════════════════════
#
# 1. Go to: https://console.aws.amazon.com/lambda
# 2. Click on "task-manager-api"
# 3. Click "Configuration" tab → "Permissions"
#    (NOTE: "Permissions" is now its own tab under Configuration,
#     not a "Resource-based policy" section)
# 4. Under "Resource-based policy" → click "Add permissions"
# 5. Statement ID:  apigateway-invoke
# 6. Principal:  apigateway.amazonaws.com
# 7. Action:  lambda:InvokeFunction
# 8. Source ARN:
#    arn:aws:execute-api:us-east-1:123456789012:abc123xyz/*
#    (replace "abc123xyz" with your API ID from Step 4)
# 9. Click "Save"

# ══════════════════════════════════════════════════════════════
# STEP 6: Create S3 Bucket + Upload Frontend
# ══════════════════════════════════════════════════════════════
#
# 1. Go to: https://console.aws.amazon.com/s3
# 2. Click "Create bucket"
# 3. Bucket name:  task-manager-sarab-2026
#    (if taken, add more numbers/dashes)
# 4. AWS Region:  US East (N. Virginia) us-east-1
# 5. "Block Public Access" → UNCHECK "Block all public access"
#    → Check "I acknowledge..."
#
#  NOTE: In the 2024+ console, "Block Public Access" is now
#        a dedicated section with 4 checkboxes. You only need
#        to uncheck "Block all public access" (the first one).
#        The other 3 can stay checked.
#
# 6. "Object Ownership" → Select "ACLs enabled"
#    (this is now shown during bucket creation)
# 7. Click "Create bucket"
# 8. Click on the bucket name
# 9. Go to "Objects" tab → "Upload"
# 10. Drag and drop these 3 files from frontend/ folder:
#      - index.html
#      - styles.css
#      - app.js
# 11. Click "Upload" → "Close"
#
# --- Set bucket policy ---
# 12. Go to "Permissions" tab → "Bucket Policy" → "Edit"
# 13. Paste this (replace BUCKET_NAME with your bucket name):
#
# {
#     "Version": "2012-10-17",
#     "Statement": [{
#         "Sid": "PublicReadGetObject",
#         "Effect": "Allow",
#         "Principal": "*",
#         "Action": "s3:GetObject",
#         "Resource": "arn:aws:s3:::task-manager-sarab-2026/*"
#     }]
# }
#
# 14. Click "Save changes"

# ══════════════════════════════════════════════════════════════
# STEP 7: Create CloudFront Distribution
# ══════════════════════════════════════════════════════════════
#
# 1. Go to: https://console.aws.amazon.com/cloudfront
# 2. Click "Create distribution"
# 3. Origin domain:  Click the dropdown and select your S3 bucket
#    (task-manager-sarab-2026.s3.us-east-1.amazonaws.com)
#
#  NOTE: The origin domain is now a dropdown that shows your
#        S3 buckets. You don't need to type the URL manually.
#        If you don't see your bucket, type the first few letters
#        to search.
#
# 4. Origin name:  S3Origin (auto-filled)
# 5. Viewer protocol policy:  "Redirect HTTP to HTTPS"
# 6. Default root object:  index.html
# 7. Click "Create distribution"
# 8. Wait 5-10 minutes → Status changes to "Deployed"
# 9. Copy the Domain Name:
#     d1234abcd.cloudfront.net
#     (save this — this is your app URL)
#
#
#
# ══════════════════════════════════════════════════════════════
# STEP 8: Connect Frontend to API
# ══════════════════════════════════════════════════════════════
#
# 1. Open frontend/app.js in VS Code
# 2. Find line 13-14, change:
#      const API_BASE_URL = "";
#    to:
#      const API_BASE_URL = "https://abc123xyz.execute-api.us-east-1.amazonaws.com";
#    (use your actual API URL from Step 4)
# 3. Save the file (Ctrl+S)
# 4. Go to S3 Console → your bucket → "Objects" tab
# 5. Upload the updated app.js (overwrite the old one)
# 6. Go to CloudFront Console → click your distribution
# 7. Click "Invalidations" tab → "Create invalidation"
# 8. Enter:  /*
# 9. Click "Create invalidation"
# 10. Wait 1-2 minutes
# 11. Open in browser:
#     https://d1234abcd.cloudfront.net

