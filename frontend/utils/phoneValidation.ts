
/**
 * Valida o número de telefone de acordo com as regras:
 * 1. Sanitização (apenas números)
 * 2. Exatamente 11 dígitos
 * 3. Começa com 070, 080 ou 090
 * 
 * @param phone String do telefone preenchido
 * @returns Objeto com status da validação, mensagem de erro e string limpa
 */
export const validatePhone = (phone: string): { isValid: boolean; message?: string; cleaned: string } => {
  if (!phone) {
    return { isValid: false, message: 'Por favor, informe o telefone.', cleaned: '' };
  }

  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 0) {
    return { isValid: false, message: 'Por favor, informe o telefone.', cleaned };
  }
  
  if (cleaned.length < 11) {
    return { isValid: false, message: 'Verifique se o número está correto.', cleaned };
  }
  
  if (cleaned.length > 11) {
    return { isValid: false, message: 'O número deve conter exatamente 11 dígitos.', cleaned };
  }
  
  const prefix = cleaned.substring(0, 3);
  if (!['070', '080', '090'].includes(prefix)) {
    return { isValid: false, message: 'O número deve começar com 070, 080 ou 090.', cleaned };
  }
  
  return { isValid: true, cleaned };
};
