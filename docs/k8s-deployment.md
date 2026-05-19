# Kubernetes Deployment Guide

## 1. Build va push image

Dat registry cua ban vao bien moi truong:

```bash
set REGISTRY=your-registry/flight-booking
docker build -t %REGISTRY%/user-service:1.0 backend/user-service
docker build -t %REGISTRY%/flight-service:1.0 backend/product-service
docker build -t %REGISTRY%/order-service:1.0 backend/order-service
docker build -t %REGISTRY%/email-service:1.0 backend/notification-service
docker build -t %REGISTRY%/api-gateway:1.0 backend/gateway
docker build -t %REGISTRY%/frontend:1.0 frontend

docker push %REGISTRY%/user-service:1.0
docker push %REGISTRY%/flight-service:1.0
docker push %REGISTRY%/order-service:1.0
docker push %REGISTRY%/email-service:1.0
docker push %REGISTRY%/api-gateway:1.0
docker push %REGISTRY%/frontend:1.0
```

Neu dung Minikube co the build truc tiep vao Docker daemon cua Minikube thay vi push registry.

## 2. Cai infrastructure bang Helm

Nen dung Helm chart chinh thuc/de facto cho cac thanh phan stateful:

```bash
kubectl create namespace flight-booking

helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add elastic https://helm.elastic.co
helm repo update

helm install oracle-db bitnami/oracle-db -n flight-booking
helm install kafka bitnami/kafka -n flight-booking --set kraft.enabled=true --set replicaCount=1
helm install elasticsearch elastic/elasticsearch -n flight-booking --set replicas=1
helm install kibana elastic/kibana -n flight-booking
helm install logstash elastic/logstash -n flight-booking
helm install zipkin bitnami/zipkin -n flight-booking
```

Trong production nen dung managed Oracle/Kafka/Elastic neu co, bat persistent volume, resource limit, backup va secret rieng.

## 3. Deploy application

Cap nhat image trong `k8s/app.yaml`, sau do:

```bash
kubectl apply -f k8s/app.yaml
kubectl -n flight-booking get pods
kubectl -n flight-booking get svc
```

Expose gateway/frontend:

```bash
kubectl -n flight-booking port-forward svc/api-gateway 8080:8080
kubectl -n flight-booking port-forward svc/frontend 3000:80
```

Voi cloud cluster, tao Ingress cho `api-gateway` va `frontend` thay vi port-forward.

## 4. Luu y cau hinh

- Service name trong Kubernetes phai khop application config: `oracle`, `kafka`, `zipkin`, `user-service`, `product-service`, `order-service`, `notification-service`.
- Nen dua password Oracle vao `Secret`, khong hard-code trong YAML production.
- Log centralized tren K8S nen dung DaemonSet Filebeat doc stdout/container logs thay vi shared Docker volume.
- Tracing can mo network tu service toi `zipkin:9411`.
