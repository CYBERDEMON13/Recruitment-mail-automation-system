pipeline {
    agent any

    environment {
        AWS_REGION = 'ap-southeast-1'
        ECR_REGISTRY = '323650982301.dkr.ecr.ap-southeast-1.amazonaws.com'
        ECR_REPOSITORY = 'recruitment-email-automation'
        IMAGE_TAG = "${BUILD_NUMBER}"
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
                      -t ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG} \
                      -t ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest \
                      .
                '''
            }
        }

        stage('Login to ECR') {
            steps {
                sh '''
                    aws ecr get-login-password --region ${AWS_REGION} | \
                    docker login \
                      --username AWS \
                      --password-stdin ${ECR_REGISTRY}
                '''
            }
        }

        stage('Push to ECR') {
            steps {
                sh '''
                    docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:${IMAGE_TAG}
                    docker push ${ECR_REGISTRY}/${ECR_REPOSITORY}:latest
                '''
            }
        }
    }

    post {
        success {
            echo 'Docker image successfully pushed to Amazon ECR!'
        }

        failure {
            echo 'Jenkins pipeline failed.'
        }
    }
}