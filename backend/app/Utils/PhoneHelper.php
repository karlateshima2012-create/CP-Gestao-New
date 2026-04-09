<?php

namespace App\Utils;

class PhoneHelper
{
    /**
     * Normaliza um número de telefone para apenas dígitos, removendo prefixo 81 se presente
     * e garantindo que comece com 0.
     */
    public static function normalize($phone)
    {
        if (empty($phone)) return $phone;
        
        // Limpeza da Entrada (Sanitização)
        $normalized = preg_replace('/\D/', '', (string)$phone);
        
        // Remove prefixo 81 se presente (Japão)
        if (str_starts_with($normalized, '81')) {
            $normalized = substr($normalized, 2);
        }
        
        $normalized = ltrim($normalized, '0');
        
        if (!empty($normalized)) {
            $normalized = '0' . $normalized;
        }
        
        return $normalized;
    }

    /**
     * Valida se o telefone está no formato exato solicitado:
     * - Exatamente 11 dígitos
     * - Iniciando com 070, 080 ou 090
     */
    public static function validateJapaneseFormat($phone): bool
    {
        $normalized = self::normalize($phone);
        
        // Regra da Validação: exatamente 11 dígitos numéricos
        if (strlen($normalized) !== 11) {
            return false;
        }
        
        // Regra da Validação: prefixos permitidos
        $prefix = substr($normalized, 0, 3);
        return in_array($prefix, ['070', '080', '090']);
    }
}
