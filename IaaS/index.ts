import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

 
const bucket = new aws.s3.Bucket("airtable-project", {
    acl: "public-read",
    website: {
        indexDocument: "index.html",
        errorDocument: "error.html",
    },
});

const bucketPolicy = new aws.s3.BucketPolicy("my-bucket-policy", {
    bucket: bucket.bucket,
    policy: bucket.bucket.apply(publicReadPolicyForBucket)
})

function publicReadPolicyForBucket(bucketName: string) {
    return JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Principal: "*",
            Action: [
                "s3:GetObject"
            ],
            Resource: [
                `arn:aws:s3:::${bucketName}/*` // policy refers to bucket name explicitly
            ]
        }]
    });
}

export const bucketName = bucket.bucket;

const s3OriginId = "myS3Origin";
const s3Distribution = new aws.cloudfront.Distribution("s3Distribution", {
    origins: [{
        domainName: bucket.bucketRegionalDomainName,
        originId: s3OriginId,
    }],
    enabled: true,
    isIpv6Enabled: true,
    comment: "Some comment",
    defaultRootObject: "index.html",

    defaultCacheBehavior: {
        allowedMethods: [
            "GET",
            "HEAD",
        ],
        cachedMethods: [
            "GET",
            "HEAD",
        ],
        targetOriginId: s3OriginId,
        forwardedValues: {
            queryString: false,
            cookies: {
                forward: "none",
            },
        },
        viewerProtocolPolicy: "allow-all",
        minTtl: 0,
        defaultTtl: 3600,
        maxTtl: 86400,
    },
    priceClass: "PriceClass_200",
    restrictions: {
        geoRestriction: {
            restrictionType: "whitelist",
            locations: [
                "UA",
            ],
        },
    },
    tags: {
        Environment: "production",
    },
    viewerCertificate: {
        cloudfrontDefaultCertificate: true,
    },
});
export const cloudFrontOriginId = s3OriginId;