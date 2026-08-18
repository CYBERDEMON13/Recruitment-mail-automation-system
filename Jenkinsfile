pipeline {
    agent any

    environment {
        AWS_REGION = 'ap-southeast-1'
        ECR_REPO = '323650982301.dkr.ecr.ap-southeast-1.amazonaws.com/recruitment-email-automation'
        IMAGE_TAG = "${BUILD_NUMBER}"
        CONTAINER_NAME = 'recruitify'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Docker Build') {
            steps {
                sh '''
                    docker build \
                    -t ${ECR_REPO}:${IMAGE_TAG} \
                    -t ${ECR_REPO}:latest .
                '''
            }
        }

        stage('Login to ECR') {
            steps {
                sh '''
                    aws ecr get-login-password --region ${AWS_REGION} | \
                    docker login --username AWS --password-stdin ${ECR_REPO}
                '''
            }
        }

        stage('Push to ECR') {
            steps {
                sh '''
                    docker push ${ECR_REPO}:${IMAGE_TAG}
                    docker push ${ECR_REPO}:latest
                '''
            }
        }

        stage('Deploy to EC2') {
            steps {
                sh '''
                    echo "Pulling latest image..."

                    docker pull ${ECR_REPO}:latest

                    echo "Stopping old container..."

                    docker stop ${CONTAINER_NAME} || true
                    docker rm ${CONTAINER_NAME} || true

                    echo "Starting new container..."

                    docker run -d \
                        --name ${CONTAINER_NAME} \
                        --restart unless-stopped \
                        -p 80:5000 \
                        --env-file /var/lib/jenkins/recruitify.env \
                        -v recruitify-data:/app/backend/data \
                        ${ECR_REPO}:latest

                    echo "Deployment completed."

                    sleep 5

                    docker ps
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    echo "Checking application health..."

                    curl --fail http://localhost/health

                    echo ""
                    echo "Application is healthy!"
                '''
            }
        }
    }

    post {
        success {
            echo '========================================='
            echo 'Recruitify deployment successful!'
            echo '========================================='
        }

        failure {
            echo '========================================='
            echo 'Recruitify deployment FAILED!'
            echo '========================================='
        }
    }
}