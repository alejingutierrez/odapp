#!/bin/bash

# ODA Platform - Production Environment Deployment Script
# Usage: ./scripts/docker-prod.sh [deploy|stop|restart|logs|backup|restore]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
BACKUP_DIR="./backups"

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

check_requirements() {
    print_status "Verificando requisitos de producción..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose no está instalado"
        exit 1
    fi
    
    if [ ! -f "$ENV_FILE" ]; then
        print_error "Archivo $ENV_FILE no encontrado!"
        print_status "Copia y configura el archivo de producción:"
        print_status "cp .env.production.example $ENV_FILE"
        exit 1
    fi
    
    # Check critical environment variables
    source "$ENV_FILE"
    
    if [ -z "$POSTGRES_PASSWORD" ] || [ -z "$JWT_SECRET" ] || [ -z "$SESSION_SECRET" ]; then
        print_error "Variables críticas no configuradas en $ENV_FILE"
        print_status "Asegúrate de configurar: POSTGRES_PASSWORD, JWT_SECRET, SESSION_SECRET"
        exit 1
    fi
}

deploy_production() {
    print_status "Desplegando entorno de producción..."
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Pull latest images
    print_status "Descargando imágenes más recientes..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull
    
    # Build application images
    print_status "Construyendo imágenes de aplicación..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache
    
    # Start services
    print_status "Iniciando servicios de producción..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    # Wait for services to be ready
    print_status "Esperando que los servicios estén listos..."
    sleep 30
    
    # Run migrations
    print_status "Ejecutando migraciones de base de datos..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" exec -T backend pnpm run db:migrate
    
    # Check service health
    print_status "Verificando estado de los servicios..."
    docker-compose -f "$COMPOSE_FILE" ps
    
    print_success "¡Despliegue de producción completado!"
    show_service_info
}

stop_production() {
    print_warning "¿Estás seguro de que quieres detener la producción? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Deteniendo servicios de producción..."
        docker-compose -f "$COMPOSE_FILE" down
        print_success "Servicios de producción detenidos!"
    else
        print_status "Operación cancelada."
    fi
}

restart_production() {
    print_status "Reiniciando servicios de producción..."
    
    # Create backup before restart
    backup_database
    
    # Restart services
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" restart
    
    print_success "Servicios reiniciados!"
}

show_logs() {
    if [ -n "$2" ]; then
        print_status "Mostrando logs para el servicio: $2"
        docker-compose -f "$COMPOSE_FILE" logs --tail=100 -f "$2"
    else
        print_status "Mostrando logs de todos los servicios..."
        docker-compose -f "$COMPOSE_FILE" logs --tail=100 -f
    fi
}

backup_database() {
    print_status "Creando respaldo de base de datos..."
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/postgres_backup_$TIMESTAMP.sql"
    
    mkdir -p "$BACKUP_DIR"
    
    docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U oda_user oda_prod > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        print_success "Respaldo creado: $BACKUP_FILE"
        
        # Compress backup
        gzip "$BACKUP_FILE"
        print_success "Respaldo comprimido: $BACKUP_FILE.gz"
        
        # Keep only last 7 backups
        find "$BACKUP_DIR" -name "postgres_backup_*.sql.gz" -type f -mtime +7 -delete
    else
        print_error "Error al crear el respaldo"
        exit 1
    fi
}

restore_database() {
    if [ -z "$2" ]; then
        print_error "Especifica el archivo de respaldo"
        print_status "Uso: $0 restore <archivo_respaldo>"
        exit 1
    fi
    
    BACKUP_FILE="$2"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "Archivo de respaldo no encontrado: $BACKUP_FILE"
        exit 1
    fi
    
    print_warning "¿Estás seguro de que quieres restaurar la base de datos? Esto sobrescribirá todos los datos actuales. (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Restaurando base de datos desde: $BACKUP_FILE"
        
        # Check if file is compressed
        if [[ "$BACKUP_FILE" == *.gz ]]; then
            zcat "$BACKUP_FILE" | docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U oda_user -d oda_prod
        else
            docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U oda_user -d oda_prod < "$BACKUP_FILE"
        fi
        
        if [ $? -eq 0 ]; then
            print_success "Base de datos restaurada exitosamente!"
        else
            print_error "Error al restaurar la base de datos"
            exit 1
        fi
    else
        print_status "Operación cancelada."
    fi
}

show_service_info() {
    print_status "Información de servicios de producción:"
    echo ""
    echo "🌐 URLs de Acceso:"
    echo "  - Frontend: http://localhost:80"
    echo "  - Backend API: http://localhost:3001"
    echo "  - Storybook: http://localhost:6006 (si está habilitado)"
    echo ""
    echo "🔧 Herramientas de Administración:"
    echo "  - Kibana: http://localhost:5601"
    echo "  - RabbitMQ Management: http://localhost:15672"
    echo "  - MinIO Console: http://localhost:9001"
    echo ""
    echo "📊 Estado de Servicios:"
    docker-compose -f "$COMPOSE_FILE" ps
}

update_application() {
    print_status "Actualizando aplicación..."
    
    # Create backup before update
    backup_database
    
    # Pull latest code (assuming git deployment)
    print_status "Actualizando código fuente..."
    git pull origin main
    
    # Rebuild and restart application services only
    print_status "Reconstruyendo servicios de aplicación..."
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build backend frontend
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-deps backend frontend
    
    # Run migrations
    print_status "Ejecutando migraciones..."
    docker-compose -f "$COMPOSE_FILE" exec -T backend pnpm run db:migrate
    
    print_success "¡Aplicación actualizada!"
}

show_help() {
    echo "ODA Platform - Script de Producción Docker"
    echo ""
    echo "Uso: $0 [comando] [opciones]"
    echo ""
    echo "Comandos:"
    echo "  deploy    - Desplegar entorno de producción completo"
    echo "  stop      - Detener servicios de producción"
    echo "  restart   - Reiniciar servicios"
    echo "  logs      - Mostrar logs (opcional: especificar servicio)"
    echo "  backup    - Crear respaldo de base de datos"
    echo "  restore   - Restaurar base de datos desde respaldo"
    echo "  update    - Actualizar aplicación (git pull + rebuild)"
    echo "  status    - Mostrar estado e información de servicios"
    echo "  help      - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 deploy"
    echo "  $0 logs backend"
    echo "  $0 backup"
    echo "  $0 restore ./backups/postgres_backup_20231201_120000.sql.gz"
    echo "  $0 update"
}

show_status() {
    show_service_info
}

# Main script logic
case "${1:-help}" in
    deploy)
        check_requirements
        deploy_production
        ;;
    stop)
        stop_production
        ;;
    restart)
        check_requirements
        restart_production
        ;;
    logs)
        show_logs "$@"
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database "$@"
        ;;
    update)
        check_requirements
        update_application
        ;;
    status)
        show_status
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
