import boto3
import json
import numpy as np


def run_aws_find():
    # ✅ Step 1: Add your credentials and region
    aws_access_key_id = 'AKIAYS2NQ3WBPVT7WXW4'
    aws_secret_access_key = '/iuhCgnqUYVZUSgUMm+RnF+9HXZSVtrArDVbFoU5'
    region_name = 'ap-southeast-1'  # or your actual region

    # ✅ Step 2: Connect to DynamoDB and get table
    dynamodb = boto3.resource(
        'dynamodb',
        region_name=region_name,
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key
    )
    table = dynamodb.Table('esp32_data')


    # Scan entire table
    response = table.scan()
    items = response['Items']

    while 'LastEvaluatedKey' in response:
        response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
        items.extend(response['Items'])

    # Extract data from 'payload' into list
    data = []
    for item in items:
        p = item['payload']
        data.append([
            float(p['temperature']),
            float(p['humidity']),
            float(p['rain_percentage']),
            float(p['moisture_percentage']),
            int(p['daynight']),
            str(p['timestamp'])  # or item['timestamp'] (same)
        ])

    # Convert to ndarray
    ndarray = np.array(data, dtype=object)

    # Print result
    print("\n\n<><><>  Shape:", ndarray.shape, " this much data fount.<><><>\n\n")
    
    # for i in range(10):
    #     print("Example row:", ndarray[i, 0])
    print(ndarray[0])
    return ndarray

run_aws_find()
