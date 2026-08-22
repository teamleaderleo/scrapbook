# Lightsail AWS dashboard

The proxy dashboard reads the Oregon Lightsail instance directly from AWS. There is no agent, timer, or transfer counter on the instance.

The dashboard uses the Lightsail APIs for:

- instance state, public/static IP status, bundle, plan and public firewall rules
- current-month `NetworkIn` and `NetworkOut`
- 24-hour transfer
- CPU utilization
- burst capacity
- Lightsail status checks
- matching-bundle transfer pooling in the same Region

It also queries Cost Explorer when `ce:GetCostAndUsage` is allowed, showing month-to-date Lightsail cost plus the Oregon transfer and overage billing usage types. Cost Explorer failure is non-fatal; the Lightsail card still renders.

Defaults:

```text
AWS_LIGHTSAIL_REGION=us-west-2
AWS_LIGHTSAIL_INSTANCE_NAME=lightsail-uswest2
```

## Vercel OIDC

Production should use Vercel OIDC instead of long-lived AWS access keys. The Vercel project is `setzen` in the `leo-lis-projects` team.

Create an IAM OIDC identity provider:

```text
Provider URL: https://oidc.vercel.com/leo-lis-projects
Audience:     https://vercel.com/leo-lis-projects
```

Create an IAM role with this trust policy, replacing the AWS account ID:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<AWS_ACCOUNT_ID>:oidc-provider/oidc.vercel.com/leo-lis-projects"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "oidc.vercel.com/leo-lis-projects:aud": "https://vercel.com/leo-lis-projects",
          "oidc.vercel.com/leo-lis-projects:sub": "owner:leo-lis-projects:project:setzen:environment:production"
        }
      }
    }
  ]
}
```

Attach this read-only policy to the role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lightsail:GetInstances",
        "lightsail:GetBundles",
        "lightsail:GetInstanceMetricData",
        "ce:GetCostAndUsage"
      ],
      "Resource": "*"
    }
  ]
}
```

Set these Vercel environment variables for Production:

```text
AWS_ROLE_ARN=arn:aws:iam::<AWS_ACCOUNT_ID>:role/<ROLE_NAME>
AWS_LIGHTSAIL_REGION=us-west-2
AWS_LIGHTSAIL_INSTANCE_NAME=lightsail-uswest2
```

Vercel supplies the OIDC token to the deployed function. The app exchanges it with AWS STS for short-lived credentials and signs the Lightsail and Cost Explorer requests server-side.

## Local fallback

For local development, the reader also accepts the standard AWS environment variables:

```text
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_SESSION_TOKEN=...        # optional
AWS_LIGHTSAIL_REGION=us-west-2
AWS_LIGHTSAIL_INSTANCE_NAME=lightsail-uswest2
```

Use short-lived credentials for local work when possible.

## Transfer accounting

The current-cycle transfer figure is the sum of AWS Lightsail `NetworkIn` and `NetworkOut` metrics from the start of the UTC calendar month. If multiple Lightsail instances in the Region use the same bundle as the target instance, the dashboard sums their transfer and their monthly allowances because Lightsail pools transfer for matching bundles in the same Region.

The card separately shows Cost Explorer transfer usage when available. Those billing figures can lag behind the Lightsail metrics, so the metric total is the live operational view and AWS Billing remains authoritative for charges and overage.
