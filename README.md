# sla-reporting

Allows to capture SLA statistics per application consuming the microgateway and optionaly send them to splunk or store them in file system 

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

Add file system log config
```yaml
sla-reporting:
  bunyan:
    name: "sla-reporting"
    stream:
      path: "/var/tmp/sla-reporting.log"
      period: '1d'
      totalFiles: 20
      rotateExisting: false
      threshold: '10m'
      gzip: false

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