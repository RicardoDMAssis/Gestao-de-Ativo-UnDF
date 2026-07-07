from rest_framework.exceptions import APIException
from rest_framework import status

class BusinessValidationError(APIException):
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Ocorreu um erro de validação de negócios.'
    default_code = 'business_validation_error'
