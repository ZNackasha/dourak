# Optimized Keycloak image: build-time options are baked in once, so each start
# skips the re-augmentation step. The 26.7 tag tracks the latest patch release;
# minor upgrades are a deliberate edit here.
FROM quay.io/keycloak/keycloak:26.7 AS builder

ENV KC_DB=mysql
ENV KC_HEALTH_ENABLED=true

RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:26.7
COPY --from=builder /opt/keycloak/ /opt/keycloak/
COPY realms/ /opt/keycloak/data/import/

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized", "--import-realm"]
