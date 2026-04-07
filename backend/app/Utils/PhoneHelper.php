<?php

namespace App\Utils;

class PhoneHelper
{
    /**
     * Normaliza um número de telefone para apenas dígitos, ajustando prefixos se necessário.
     * Retornado para evitar erro no PHPStan após remoção acidental pelo dev.
     */
    public static function normalize($phone)
    {
        if (empty($phone)) return $phone;
        
        $normalized = preg_replace('/\D/', '', (string)$phone);
        
        if (str_starts_with($normalized, '81')) {
            $normalized = substr($normalized, 2);
        }
        
        $normalized = ltrim($normalized, '0');
        
        if (!empty($normalized)) {
            $normalized = '0' . $normalized;
        }
        
        return $normalized;
    }
}
