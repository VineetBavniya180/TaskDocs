# Grafana
Grafana is an open-source observability and visualization platform. It lets you query, visualize, alert on, and explore metrics, logs, and traces from various data sources.

**🔑 Key Features:**
* **Dashboards** – Create rich, interactive dashboards with graphs, heatmaps, tables, and more.
* **Data Sources** – Supports Prometheus, Loki, InfluxDB, Elasticsearch, MySQL, PostgreSQL, and many others.
* **Alerting** – Set alerts on metrics with notifications to Slack, PagerDuty, Teams, Email, etc.
* **Explore Mode** – Debug by drilling into logs, metrics, and traces side-by-side.
* **Plugins** – Extend Grafana with community or enterprise plugins (data sources, panels, apps).
* **Authentication** – LDAP, OAuth, SAML, or built-in user management.

**📦 Common Use Cases:**
* Kubernetes / Cloud Monitoring (with Prometheus & Loki).
* Application Performance Monitoring (APM).
* Business Intelligence dashboards (with SQL DBs).
* IoT and sensor data visualization.

👉 Example: In Kubernetes, people often pair **Prometheus + Grafana + Loki**.


# Prometheus
Prometheus is an open-source monitoring and alerting toolkit that’s especially popular for cloud-native and Kubernetes environments.

* **🔑 Key Features:**
    * **Time-series database (TSDB)** – Stores metrics as time-stamped data.
    * **Powerful query language (PromQL)** – Lets you query and aggregate metrics in real time.
    * **Pull-based model** – Prometheus scrapes metrics from applications, services, and exporters over HTTP.
    * **Service discovery** – Auto-discovers targets in Kubernetes, Consul, EC2, etc.
    * **Alertmanager** – Handles alerts and routes them to Slack, PagerDuty, Email, etc.
    * **Integrations** – Works seamlessly with Grafana for visualization.

* **📦 Common Use Cases:**  
    * Kubernetes monitoring (pods, nodes, API server, etc.).
    * Application monitoring (via client libraries in Go, Java, Python, Node.js).
    * Infrastructure monitoring (servers, VMs, databases, networking).
    * Custom metrics (business or app-specific).


* **⚙️ Core Components:**
    * **Prometheus server** – scrapes and stores metrics.
    * **Exporters** – expose metrics in Prometheus format (e.g., node_exporter for Linux metrics, mysqld_exporter for MySQL).
    * **Alertmanager** – manages alerts and notifications.
    * **Pushgateway** – for short-lived jobs (batch jobs).

* **🚀 How it works (simple flow):**
    * Applications/servers expose metrics at an endpoint (e.g., /metrics).
    * Prometheus scrapes these metrics at regular intervals.
    * Data is stored in its TSDB.
    * PromQL queries are used for analysis.
    * Grafana (or Prometheus UI) visualizes them.
    * Alertmanager triggers alerts if conditions are met.

# Grafanaloki
Grafana Loki (often just called Loki) is a log aggregation system developed by Grafana Labs.
It’s often paired with Prometheus and Grafana to create a full observability stack.

**What Loki Does**
* Collects, stores, and queries logs (like application logs, system logs, Kubernetes pod logs, etc.).
* Designed to be cost-effective by storing logs in an index-free way (unlike Elasticsearch or Splunk).
* Uses the same labels as Prometheus metrics, so you can easily correlate logs with metrics and dashboards.

**Key Features**

* **LogQL**: Loki’s query language (similar to PromQL but for logs).
* **Scalable**: Works well in microservices or Kubernetes environments.
* **Efficient**: Instead of indexing the full log content, Loki only indexes labels (metadata), making it lightweight.
* **Integrations**:
    * **Promtail** → Loki’s default log shipper (collects logs from files, containers, or syslog and pushes them to Loki).
    * **Fluentd/Fluent Bit** → Other log shippers supported.
    * **Grafana** → Provides UI for searching, visualizing, and correlating logs.

**How It Fits in the Stack**
* **Prometheus** → Metrics (CPU, memory, request latency).
* **Loki** → Logs (application/system logs).
* **Grafana** → Visualization for both metrics and logs.
* **Tempo** (optional) → Traces.

<hr>

# 🚀 Node.js + Prometheus + Loki + Grafana Monitoring & Logging
**This project demonstrates how to run a basic Express.js application with:**
* **Prometheus** → Collect application metrics
* **Grafana Loki** → Store logs
* **Grafana** → Visualize metrics & logs
* **NodePort Services** for external access

**📂 Project Structure**

```
.
├── distroless.yaml        # Node.js app deployment (using distroless image)
├── dockerfile             # Multi-stage build for Express app
├── grafanaloki.yaml       # Loki deployment + service
├── grafana.yaml           # Grafana deployment + service
├── prometheus.yaml        # Prometheus config + deployment
├── package.json           # Node.js dependencies
├── package-lock.json
├── server.js              # Express.js application
└── README.md              # Documentation
```

**🟢 1. Express.js Application**  
```server.js```
* Basic **Express server**
* ```/ready``` endpoint for health check
* ```/metrics``` endpoint for Prometheus
* Sample slow endpoints (```/slow```,```/very-slow```)

**🐳 2. Dockerfile**

```
FROM node:22 AS build-env
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

FROM gcr.io/distroless/nodejs22-debian12
ENV NODE_ENV=production
ENV PORT=3000
ENV LOKI_HOST=http://grafanaloki:3100
WORKDIR /app
COPY --from=build-env /app /app
EXPOSE 3000
CMD ["server.js"]
```

**☸️ 3. Kubernetes YAMLs**
All manifests are inside project root.
* ```distroless.yaml``` → Node.js app Deployment + Service + ConfigMap
* ```prometheus.yaml``` → Prometheus config (scraping Node.js app + Loki) + ConfigMap + Service
* ```grafanaloki.yaml``` → Loki Deployment + Service
* ```grafana.yaml``` → Grafana Deployment + Service  
Each service is exposed via **NodePort**:
* Node app → 31001
* Loki → 31002
* Grafana → 31003
* Prometheus → 31000


**ConfigMap in ```Promethues.yaml```**
```
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 4s

    scrape_configs:
      - job_name: prometheus
        static_configs:
          - targets: ["172.18.0.3:31001"] #Put your nodeapplication nodeIP + NodePort
```

**ConfigMap in ```distroless.yaml```**
```
apiVersion: v1
kind: ConfigMap
metadata:
  name: distroless-config
data:
  NODE_ENV: "production"
  PORT: "3000"
  LOKI_HOST: "http://172.18.0.3:31002"  # put your loki where loki deploy nodeIp + NodePort  
```


**🔗 4. Connecting Components**
* Node.js app exposes /metrics → Scraped by Prometheus
* Node.js logs → Sent to Loki
* Grafana connects to Prometheus (metrics) + Loki (logs)