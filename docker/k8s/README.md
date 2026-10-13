# Kubernetes: local accounts

`deployment.yaml` deploys the frontend and backend in namespace `example`, with Services, ConfigMaps, a connection Secret, HTTPS Ingress and backend ingress isolation. MongoDB and Redis must already be running and reachable from the backend. Use persistent MongoDB storage and Redis persistence (AOF or equivalent) for accounts, results, sessions and daily rankings. No application PVC or storage class is needed; application logs also go to stdout and their file copies are temporary.

## Build with Docker, without Compose

Run from the repository root, on an internet-connected machine:

```sh
docker build --platform linux/amd64 -f docker/Dockerfile.local --target backend -t docker.io/vaxops/monkeytype-local-backend:local-auth-v1 .
docker build --platform linux/amd64 -f docker/Dockerfile.local --target frontend -t docker.io/vaxops/monkeytype-local-frontend:local-auth-v1 .
```

These are example repository names, not published images. Change `vaxops` to your Docker Hub account or use your internal registry. Change the platform if your Kubernetes workers use ARM64. Both commands use the same multi-stage Dockerfile and cached builder: locked pnpm dependencies, shared-package compilation, backend compilation and a frontend build with `AUTH_PROVIDER=local`, `BACKEND_URL=/api`. The backend target contains Node and production dependencies; the frontend target contains nginx and static assets. Firebase credentials are not needed. MongoDB and Redis are separate services, not included in these images.

If your cluster can access Docker Hub, publish your built images yourself:

```sh
docker login docker.io
docker push docker.io/vaxops/monkeytype-local-backend:local-auth-v1
docker push docker.io/vaxops/monkeytype-local-frontend:local-auth-v1
```

For a closed network, export on this machine:

```sh
docker save -o monkeytype-app-images.tar docker.io/vaxops/monkeytype-local-backend:local-auth-v1 docker.io/vaxops/monkeytype-local-frontend:local-auth-v1
```

Transfer the archive to a connected staging host inside that network, `docker load -i monkeytype-app-images.tar`, tag/push both images to a registry reachable by the cluster, then change both Deployment image references. Loading images into Docker on your workstation does not load them into Kubernetes workers. Use unique version tags (or digests) for subsequent releases.

## Configure

Edit a local copy of `deployment.yaml` before applying:

- Replace both image references with repositories you can pull from. For private repositories, create a registry pull Secret in `example` and add `imagePullSecrets` to both pod specs, or use your cluster's existing registry configuration.
- Replace `monkeytype.example.internal` in both `FRONTEND_URL` and the Ingress host/TLS host. Use the same HTTPS origin with no trailing slash, and point its DNS to your ingress controller.
- Replace `ingressClassName: example` with your installed IngressClass. An Ingress controller is required; the YAML does not install one. Configure its HTTP-to-HTTPS redirect and preserve the original `X-Forwarded-Proto` and `X-Forwarded-For` headers.
- Replace nginx's `set_real_ip_from 127.0.0.1` with the trusted ingress proxy source IP/CIDR. Add further directives if needed. Restrict frontend access to that proxy at your network/CNI boundary. Do not trust arbitrary sources: nginx forwards the resolved client IP to the API, which applies authentication limits per IP. Until configured, users behind one ingress proxy share its 20-auth-requests/15-minute limit.
- Replace `DB_URI`, `DB_USERNAME`, `DB_PASSWORD` and `REDIS_URI` with your existing database connections. `DB_NAME` is `monkeytype`; set `DB_AUTH_SOURCE` to the database containing the MongoDB login, often `admin`. The MongoDB user needs `readWrite` on `monkeytype` (including creating collections/indexes). Percent-encode reserved Redis password characters in its URI. For unauthenticated databases, set MongoDB username/password to empty strings and use `redis://monkeytype-redis:6379/0`. Use cross-namespace service DNS or external hostnames when necessary.
- Keep real credentials in your deployment copy/secret manager, not Git. The committed Secret contains placeholders only. Local account passwords are stored as salted scrypt hashes in MongoDB; no Firebase or email credentials are needed.

This preset enables registration, profiles, saved results, XP and daily English 15/60-second boards. Change its embedded `backend-configuration.json` to customize those features. Keep backend replicas at one: this deployment runs the application's scheduled jobs in-process and has not been validated for multiple backend replicas. The 1 GiB backend limit accommodates its two concurrent, memory-intensive scrypt operations; adjust resources after measuring your workload.

## Deploy

With your cluster selected in kubectl, create/use namespace `example`, then supply a certificate/key trusted by your users (for example from your internal CA):

```sh
kubectl create namespace example --dry-run=client -o yaml | kubectl apply -f -
kubectl -n example create secret tls monkeytype-tls --cert=monkeytype.crt --key=monkeytype.key --dry-run=client -o yaml | kubectl apply -f -
kubectl apply --dry-run=server -f docker/k8s/deployment.yaml
kubectl apply -f docker/k8s/deployment.yaml
kubectl -n example rollout status deployment/monkeytype-backend --timeout=300s
kubectl -n example rollout status deployment/monkeytype-frontend --timeout=300s
```

Open `https://monkeytype.example.internal` after replacing it with your hostname. The browser calls `/api` on the same origin; nginx forwards to the internal backend Service. The frontend uses port 8080 as a non-root user through a mounted nginx configuration. Both containers use read-only root filesystems with writable temporary/log mounts. NetworkPolicy restricts backend ingress to frontend pods in the same namespace when supported by your CNI; this policy does not restrict outbound traffic. Configure egress isolation separately if your connected cluster must block internet access.

After editing ConfigMaps or Secrets, apply and restart both Deployments; configuration files are mounted using `subPath` and backend settings are read at startup:

```sh
kubectl apply -f docker/k8s/deployment.yaml
kubectl -n example rollout restart deployment/monkeytype-backend deployment/monkeytype-frontend
```

Administrator password recovery preserves typing history and revokes existing sessions:

```sh
kubectl -n example exec -it deployment/monkeytype-backend -- node scripts/reset-local-password.js user@example.com
```

Enter the new password at the hidden prompt. Diagnose startup failures with `kubectl -n example logs deployment/monkeytype-backend` and `kubectl -n example describe pods`. Startup/readiness probes check HTTP availability; they are not continuous database health checks. Back up your separately managed MongoDB/Redis storage before upgrades.

References: [Kubernetes Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/), [Kubernetes Secrets](https://kubernetes.io/docs/concepts/configuration/secret/).
