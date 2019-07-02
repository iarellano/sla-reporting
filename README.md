# sla-reporting

Allows to capture SLA statistics per application consuming the microgateway and send them to splunk

## Install dependencies

```bash
npm install
```

## Configuration

Add splunk configs to your config file like below with your own values.
```yaml
sla-reporting:
  splunk:
    config:
      token: "702be901-fd07-496b-8682-4074d4467aa7"
      url: "http://localhost:8088"
    metadata:
      host: "jupiter"
      source: "rmg"
      index: "main"
      sourcetype: "json"
```

Enable the plugin in execution sequence.
```yaml
edgemicro:
  plugins:
    sequence:
      - oauth
      - sla-reporting
```

Finally reload microgateway.