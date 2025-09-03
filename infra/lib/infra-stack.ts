import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as iam from 'aws-cdk-lib/aws-iam';
import dotenv from 'dotenv'
dotenv.config()

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket stores raw card images
    const cardBucket = new s3.Bucket(this, 'CardImageBacket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    })

    // SQS Queue for scanned card data objects staged for processing by lambda
    const cardQueue = new sqs.Queue(this, 'CardQueue', {
      visibilityTimeout: cdk.Duration.seconds(30),
      retentionPeriod: cdk.Duration.days(4)
    })

    // DynamoDB Table for card inventory
    const cardTable = new dynamodb.Table(this, 'CardTable', {
      partitionKey: { name: 'cardId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY
    })

    // Lambda for processing messages
    const cardProcessor = new lambda.Function(this, 'CardProcessorFn', {
      runtime: lambda.Runtime.NODEJS_LATEST,
      handler: 'handler.handler',
      code:lambda.Code.fromAsset('../lambdas/card-processor/dist'),
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
      environment: {
        CARD_TABLE: cardTable.tableName,
        JTCG_API_KEY: process.env.JTCG_API_KEY ?? ''
      }
    })

    cardTable.grantWriteData(cardProcessor)
    cardBucket.grantRead(cardProcessor)
    cardQueue.grantConsumeMessages(cardProcessor)

    cardProcessor.addEventSourceMapping('CardQueueSource', {
      eventSourceArn: cardQueue.queueArn,
      batchSize: 1
    })

    cardBucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3n.SqsDestination(cardQueue))
  }
}
