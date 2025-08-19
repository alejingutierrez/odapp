#!/bin/bash

# ODA Platform - Comprehensive Backup and Restore Script
# Usage: ./scripts/backup-restore.sh [backup|restore|schedule|list] [options]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RETENTION_DAYS=30

# Functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

create_backup_dir() {
    mkdir -p "$BACKUP_DIR"/{postgres,redis,elasticsearch,minio,configs}
}

backup_postgres() {
    print_status "Creando backup de PostgreSQL..."
    
    local backup_file="$BACKUP_DIR/postgres/postgres_$TIMESTAMP.sql"
    
    if docker-compose ps postgres | grep -q "Up"; then
        docker-compose exec -T postgres pg_dump -U oda_user oda_prod > "$backup_file"
        gzip "$backup_file"
        print_success "Backup PostgreSQL: $backup_file.gz"
    else
        print_error "PostgreSQL no está ejecutándose"
        return 1
    fi
}

backup_redis() {
    print_status "Creando backup de Redis..."
    
    local backup_file="$BACKUP_DIR/redis/redis_$TIMESTAMP.rdb"
    
    if docker-compose ps redis | grep -q "Up"; then
        # Trigger Redis save
        docker-compose exec redis redis-cli -a "$REDIS_PASSWORD" BGSAVE
        sleep 5
        
        # Copy RDB file
        docker-compose exec redis cat /data/dump.rdb > "$backup_file"
        gzip "$backup_file"
        print_success "Backup Redis: $backup_file.gz"
    else
        print_error "Redis no está ejecutándose"
        return 1
    fi
}

backup_elasticsearch() {
    print_status "Creando backup de Elasticsearch..."
    
    local backup_dir="$BACKUP_DIR/elasticsearch/es_$TIMESTAMP"
    mkdir -p "$backup_dir"
    
    if docker-compose ps elasticsearch | grep -q "Up"; then
        # Create snapshot repository
        curl -X PUT "localhost:9200/_snapshot/backup_repo" -H 'Content-Type: application/json' -d'{
            "type": "fs",
            "settings": {
                "location": "/usr/share/elasticsearch/backup"
            }
        }'
        
        # Create snapshot
        curl -X PUT "localhost:9200/_snapshot/backup_repo/snapshot_$TIMESTAMP?wait_for_completion=true"
        
        # Export snapshot data
        docker-compose exec elasticsearch tar czf "/tmp/es_backup_$TIMESTAMP.tar.gz" -C /usr/share/elasticsearch/backup .
        docker-compose exec elasticsearch cat "/tmp/es_backup_$TIMESTAMP.tar.gz" > "$backup_dir/elasticsearch_$TIMESTAMP.tar.gz"
        
        print_success "Backup Elasticsearch: $backup_dir/elasticsearch_$TIMESTAMP.tar.gz"
    else
        print_error "Elasticsearch no está ejecutándose"
        return 1
    fi
}

backup_minio() {
    print_status "Creando backup de MinIO..."
    
    local backup_dir="$BACKUP_DIR/minio/minio_$TIMESTAMP"
    mkdir -p "$backup_dir"
    
    if docker-compose ps minio | grep -q "Up"; then
        # Export MinIO data
        docker-compose exec minio tar czf "/tmp/minio_backup_$TIMESTAMP.tar.gz" -C /data .
        docker-compose exec minio cat "/tmp/minio_backup_$TIMESTAMP.tar.gz" > "$backup_dir/minio_$TIMESTAMP.tar.gz"
        
        print_success "Backup MinIO: $backup_dir/minio_$TIMESTAMP.tar.gz"
    else
        print_error "MinIO no está ejecutándose"
        return 1
    fi
}

backup_configs() {
    print_status "Creando backup de configuraciones..."
    
    local backup_file="$BACKUP_DIR/configs/configs_$TIMESTAMP.tar.gz"
    
    tar czf "$backup_file" \
        docker-compose.yml \
        docker-compose.prod.yml \
        .env.production \
        .env.development \
        docker/ \
        scripts/ \
        Dockerfile.* \
        2>/dev/null || true
    
    print_success "Backup configuraciones: $backup_file"
}

full_backup() {
    print_status "Iniciando backup completo del sistema..."
    
    create_backup_dir
    
    # Load environment variables
    if [ -f ".env.production" ]; then
        source .env.production
    fi
    
    local success_count=0
    local total_count=5
    
    # Backup each service
    backup_postgres && ((success_count++)) || true
    backup_redis && ((success_count++)) || true
    backup_elasticsearch && ((success_count++)) || true
    backup_minio && ((success_count++)) || true
    backup_configs && ((success_count++)) || true
    
    # Create backup manifest
    local manifest_file="$BACKUP_DIR/backup_manifest_$TIMESTAMP.json"
    cat > "$manifest_file" << EOF
{
    "timestamp": "$TIMESTAMP",
    "date": "$(date -Iseconds)",
    "services_backed_up": $success_count,
    "total_services": $total_count,
    "backup_location": "$BACKUP_DIR",
    "retention_days": $RETENTION_DAYS
}
EOF
    
    print_success "Backup completo finalizado: $success_count/$total_count servicios"
    print_status "Manifiesto: $manifest_file"
    
    # Cleanup old backups
    cleanup_old_backups
}

restore_postgres() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        print_error "Archivo de backup no encontrado: $backup_file"
        return 1
    fi
    
    print_warning "¿Restaurar PostgreSQL desde $backup_file? Esto sobrescribirá todos los datos. (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Restaurando PostgreSQL..."
        
        if [[ "$backup_file" == *.gz ]]; then
            zcat "$backup_file" | docker-compose exec -T postgres psql -U oda_user -d oda_prod
        else
            docker-compose exec -T postgres psql -U oda_user -d oda_prod < "$backup_file"
        fi
        
        print_success "PostgreSQL restaurado exitosamente"
    fi
}

restore_redis() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        print_error "Archivo de backup no encontrado: $backup_file"
        return 1
    fi
    
    print_warning "¿Restaurar Redis desde $backup_file? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Restaurando Redis..."
        
        # Stop Redis temporarily
        docker-compose stop redis
        
        # Restore RDB file
        if [[ "$backup_file" == *.gz ]]; then
            zcat "$backup_file" | docker-compose exec -T redis tee /data/dump.rdb > /dev/null
        else
            docker-compose exec -T redis tee /data/dump.rdb < "$backup_file" > /dev/null
        fi
        
        # Start Redis
        docker-compose start redis
        
        print_success "Redis restaurado exitosamente"
    fi
}

list_backups() {
    print_status "Backups disponibles:"
    echo ""
    
    if [ -d "$BACKUP_DIR" ]; then
        find "$BACKUP_DIR" -name "backup_manifest_*.json" -exec echo "📋 Backup completo:" \; -exec cat {} \; -exec echo "" \;
        
        echo "📊 PostgreSQL:"
        find "$BACKUP_DIR/postgres" -name "*.sql.gz" 2>/dev/null | sort -r | head -10 || echo "  No hay backups disponibles"
        
        echo ""
        echo "🔄 Redis:"
        find "$BACKUP_DIR/redis" -name "*.rdb.gz" 2>/dev/null | sort -r | head -10 || echo "  No hay backups disponibles"
        
        echo ""
        echo "🔍 Elasticsearch:"
        find "$BACKUP_DIR/elasticsearch" -name "*.tar.gz" 2>/dev/null | sort -r | head -10 || echo "  No hay backups disponibles"
        
        echo ""
        echo "📦 MinIO:"
        find "$BACKUP_DIR/minio" -name "*.tar.gz" 2>/dev/null | sort -r | head -10 || echo "  No hay backups disponibles"
    else
        print_warning "No se encontró el directorio de backups: $BACKUP_DIR"
    fi
}

cleanup_old_backups() {
    print_status "Limpiando backups antiguos (>$RETENTION_DAYS días)..."
    
    local deleted_count=0
    
    # Clean PostgreSQL backups
    find "$BACKUP_DIR/postgres" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null && ((deleted_count++)) || true
    
    # Clean Redis backups
    find "$BACKUP_DIR/redis" -name "*.rdb.gz" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null && ((deleted_count++)) || true
    
    # Clean Elasticsearch backups
    find "$BACKUP_DIR/elasticsearch" -name "*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null && ((deleted_count++)) || true
    
    # Clean MinIO backups
    find "$BACKUP_DIR/minio" -name "*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null && ((deleted_count++)) || true
    
    # Clean config backups
    find "$BACKUP_DIR/configs" -name "*.tar.gz" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null && ((deleted_count++)) || true
    
    # Clean manifests
    find "$BACKUP_DIR" -name "backup_manifest_*.json" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null && ((deleted_count++)) || true
    
    print_success "Limpieza completada"
}

setup_cron_backup() {
    print_status "Configurando backup automático..."
    
    local cron_schedule="${1:-0 2 * * *}"  # Default: 2 AM daily
    local script_path="$(pwd)/scripts/backup-restore.sh"
    
    # Create cron job
    (crontab -l 2>/dev/null; echo "$cron_schedule cd $(pwd) && $script_path backup >> /var/log/oda-backup.log 2>&1") | crontab -
    
    print_success "Backup automático configurado: $cron_schedule"
    print_status "Logs en: /var/log/oda-backup.log"
}

show_help() {
    echo "ODA Platform - Script de Backup y Restore"
    echo ""
    echo "Uso: $0 [comando] [opciones]"
    echo ""
    echo "Comandos:"
    echo "  backup                    - Crear backup completo del sistema"
    echo "  restore postgres <file>   - Restaurar PostgreSQL desde archivo"
    echo "  restore redis <file>      - Restaurar Redis desde archivo"
    echo "  list                      - Listar backups disponibles"
    echo "  cleanup                   - Limpiar backups antiguos"
    echo "  schedule [cron]           - Configurar backup automático"
    echo "  help                      - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 backup"
    echo "  $0 restore postgres ./backups/postgres/postgres_20231201_120000.sql.gz"
    echo "  $0 schedule '0 3 * * *'   # Backup diario a las 3 AM"
    echo "  $0 list"
    echo "  $0 cleanup"
}

# Main script logic
case "${1:-help}" in
    backup)
        full_backup
        ;;
    restore)
        case "$2" in
            postgres)
                restore_postgres "$3"
                ;;
            redis)
                restore_redis "$3"
                ;;
            *)
                print_error "Especifica el servicio a restaurar: postgres, redis"
                exit 1
                ;;
        esac
        ;;
    list)
        list_backups
        ;;
    cleanup)
        cleanup_old_backups
        ;;
    schedule)
        setup_cron_backup "$2"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Comando desconocido: $1"
        show_help
        exit 1
        ;;
esac
