import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const epi = 2319918721;
const appId = "lZ1yniU6yXlPJi8fRRmY7aBja3XviY7Q";
const appKey = "fDswB@nM#Lq5@@ZrGnnyS2mgmcOYqcX0";

function App() {
  const [clientToken, setClientToken] = useState('');
  const [formValues, setFormValues] = useState({
    email: '',
    emailError: '',
    phone: '',
    phoneError: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    cardNumber: '',
    cardError: '',
    expiry: '',
    expiryError: '',
    cvv: '',
    cvvError: '',
    nameOnCard: '',
  });
  const [submitError, setSubmitError] = useState('');

  const success = data => {
    toast.success(
      <div>
        Payment Successful
        <br />
        Tran No: {data.tran_no}
        <br />
        Approval Code: {data.approval_code}
        <br />
        Transaction Status: {data.msg}
      </div>,
      {
        position: toast.POSITION.TOP_RIGHT,
      }
    );
  };

  const error = () => {
    toast.error('Payment Error', {
      position: toast.POSITION.TOP_RIGHT,
    });
  };

  useEffect(() => {
    const fetchAppId = async () => {
      const options = {
        method: 'POST',
        body: JSON.stringify({
          appid: appId,
          appkey: appKey,
          txn_type: 'clientToken',
          epi: epi,
        }),
      };
      const getToken = await fetch('https://securelink-staging.valorpaytech.com:4430', options).then(function (response) {
        return response.json();
      });
      if (getToken.clientToken) {
        setClientToken(getToken.clientToken);
      }
    };
    fetchAppId();
  }, []);

  useEffect(() => {
    const script = document.createElement('script');
    script.id = 'valorPassageScript';

    script.src = 'https://js.valorpaytech.com/V1/js/Passage.min.js';

    script.async = true;
    script.setAttribute('data-name', 'valor_passage');
    script.setAttribute('data-clientToken', clientToken);
    script.setAttribute('data-epi', epi);

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [clientToken]);

  const createCardToken = async () => {
    const cardDetails = {
      pan: formValues.cardNumber.replace(/\s+/g, ''),
      expirydate: formValues.expiry.replace(/\//g, ''),
    };

    const options = {
      method: 'POST',
      headers: { accept: 'application/json' },
      body: new URLSearchParams({
        txn_type: 'cardToken',
        epi: epi,
        client_token: clientToken,
        ...cardDetails,
      }),
    };

    try {
      const response = await fetch('https://securelink-staging.valorpaytech.com:4430/', options);
      const data = await response.json();
      if (data.cardToken) {
        performSale(data.cardToken);
      } else {
        console.error('Failed to create card token');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const performSale = async cardToken => {
    const saleDetails = {
      appid: appId,
      appkey: appKey,
      epi: epi,
      txn_type: 'sale',
      token: cardToken,
      amount: '5.00',
      surchargeIndicator: '0',
      surchargeAmount: '5.00',
      phone: formValues.phone,
      address1: formValues.address1,
      city: formValues.city,
      state: formValues.state,
      shipping_country: 'US',
      billing_country: 'US',
      zip: '50001',
      email: formValues.email,
    };

    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(saleDetails),
    };

    try {
      const response = await fetch('https://securelink-staging.valorpaytech.com:4430/', options);
      const data = await response.json();
      console.log(data);
      if (data.error_no === 'S00' && data.msg === 'APPROVED') {
        setFormValues({
          email: '',
          phone: '',
          address1: '',
          address2: '',
          city: '',
          state: '',
          cardNumber: '',
          expiry: '',
          expiryError: '',
          cvv: '',
          nameOnCard: '',
        });
        success(data);
      } else {
        error();
      }
    } catch (err) {
      error();
    }
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormValues({
      ...formValues,
      [name]: value,
    });
  };

  const validateEmail = email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = phone => {
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    return phoneRegex.test(phone);
  };

  const validateCard = cardNumber => {
    const cardRegex = /^\d{4} \d{4} \d{4} \d{4}$/;
    return cardRegex.test(cardNumber);
  };

  function validateExpiry(expiry) {
    const [month, year] = expiry.split('/');
    if (!month || !year || month.length !== 2 || year.length !== 2) {
      return false;
    }

    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    const expMonth = parseInt(month, 10);
    const expYear = parseInt(year, 10);

    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
      return false;
    }

    if (expMonth < 1 || expMonth > 12) {
      return false;
    }

    return true;
  }

  function validateCVV(cvv) {
    return /^\d{3,4}$/.test(cvv);
  }

  const handleEmailBlur = () => {
    if (!validateEmail(formValues.email)) {
      setFormValues(prevState => ({
        ...prevState,
        emailError: 'Please enter a valid email address',
      }));
    } else {
      setFormValues(prevState => ({
        ...prevState,
        emailError: '',
      }));
    }
  };

  const handleEmailInputChange = e => {
    const { value } = e.target;
    setFormValues(prevState => ({
      ...prevState,
      email: value,
    }));
  };

  const handlePhoneInputChange = e => {
    const { value } = e.target;
    const cleaned = value.replace(/\D+/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    const formattedValue = !match[2] ? match[1] : `${match[1]}-${match[2]}${match[3] ? `-${match[3]}` : ''}`;
    setFormValues(prevState => ({
      ...prevState,
      phone: formattedValue,
    }));
  };

  const handlePhoneBlur = () => {
    if (!validatePhone(formValues.phone)) {
      setFormValues(prevState => ({
        ...prevState,
        phoneError: 'Please enter a valid phone number',
      }));
    } else {
      setFormValues(prevState => ({
        ...prevState,
        phoneError: '',
      }));
    }
  };

  const handleCardInputChange = e => {
    const { value } = e.target;
    const cleaned = value.replace(/\D+/g, '');
    const match = cleaned.match(/^(\d{0,4})(\d{0,4})(\d{0,4})(\d{0,4})$/);
    const formattedValue = !match[2] ? match[1] : `${match[1]} ${match[2]}${match[3] ? ` ${match[3]}` : ''}${match[4] ? ` ${match[4]}` : ''}`;
    setFormValues(prevState => ({
      ...prevState,
      cardNumber: formattedValue,
    }));
  };

  const handleCardBlur = () => {
    if (!validateCard(formValues.cardNumber)) {
      setFormValues(prevState => ({
        ...prevState,
        cardError: 'Please enter a valid card number',
      }));
    } else {
      setFormValues(prevState => ({
        ...prevState,
        cardError: '',
      }));
    }
  };

  const handleExpiryChange = e => {
    let { value } = e.target;
    if (value.length === 2 && formValues.expiry.length !== 3) {
      value += '/';
    }
    value = value.slice(0, 5).replace(/[^\d/]/g, '');
    setFormValues(prevState => ({
      ...prevState,
      expiry: value,
      expiryError: '',
    }));
  };

  const handleExpiryBlur = () => {
    const expiryError = validateExpiry(formValues.expiry) ? '' : 'Invalid expiry date. Please use MM/YY format.';
    setFormValues(prevState => ({
      ...prevState,
      expiryError: expiryError,
    }));
  };

  const handleCVVInputChange = e => {
    const { value } = e.target;
    const formattedValue = value.replace(/\D+/g, '').slice(0, 4);
    setFormValues(prevState => ({
      ...prevState,
      cvv: formattedValue,
      cvvError: '',
    }));
  };

  const handleCVVBlur = () => {
    const cvvError = validateCVV(formValues.cvv) ? '' : 'Invalid CVV. Must be 3 or 4 digits.';
    setFormValues(prevState => ({
      ...prevState,
      cvvError: cvvError,
    }));
  };

  const handleSubmit = e => {
    e.preventDefault();

    const errorFields = Object.keys(formValues).filter(key => key.endsWith('Error'));
    const hasErrors = errorFields.some(errorField => formValues[errorField]);

    if (hasErrors) {
      setSubmitError('Please correct the errors before submitting.');
    } else {
      createCardToken();
    }
  };

  const states = [
    'Alabama',
    'Alaska',
    'Arizona',
    'Arkansas',
    'California',
    'Colorado',
    'Connecticut',
    'Delaware',
    'Florida',
    'Georgia',
    'Hawaii',
    'Idaho',
    'Illinois',
    'Indiana',
    'Iowa',
    'Kansas',
    'Kentucky',
    'Louisiana',
    'Maine',
    'Maryland',
    'Massachusetts',
    'Michigan',
    'Minnesota',
    'Mississippi',
    'Missouri',
    'Montana',
    'Nebraska',
    'Nevada',
    'New Hampshire',
    'New Jersey',
    'New Mexico',
    'New York',
    'North Carolina',
    'North Dakota',
    'Ohio',
    'Oklahoma',
    'Oregon',
    'Pennsylvania',
    'Rhode Island',
    'South Carolina',
    'South Dakota',
    'Tennessee',
    'Texas',
    'Utah',
    'Vermont',
    'Virginia',
    'Washington',
    'West Virginia',
    'Wisconsin',
    'Wyoming',
  ];

  useEffect(() => {
    const errorFields = Object.keys(formValues).filter(key => key.endsWith('Error'));

    const hasErrors = errorFields.some(errorField => formValues[errorField]);

    if (!hasErrors) {
      setSubmitError('');
    }
  }, [formValues.emailError, formValues.phoneError, formValues.cardError, formValues.expiryError, formValues.cvvError]);

  return (
    <>
      <ToastContainer />
      <form onSubmit={handleSubmit} id='valor-checkout-form'>
        <img src='./valorlogo.png' alt='valorlogo' />

        <label>Email</label>
        <input type='email' name='email' placeholder='Email' value={formValues.email} onChange={handleEmailInputChange} onBlur={handleEmailBlur} required />
        {formValues.emailError && <div style={{ color: 'red' }}>{formValues.emailError}</div>}

        <label>Phone</label>
        <input type='tel' name='phone' value={formValues.phone} onChange={handlePhoneInputChange} onBlur={handlePhoneBlur} placeholder='XXX-XXX-XXXX' maxLength='12' required />
        {formValues.phoneError && <div style={{ color: 'red' }}>{formValues.phoneError}</div>}

        <label>Billing Address</label>
        <input type='text' name='address1' placeholder='Address Line 1' value={formValues.address1} onChange={handleInputChange} required />
        <input type='text' name='address2' placeholder='Address Line 2' value={formValues.address2} onChange={handleInputChange} />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <input type='text' name='city' placeholder='City' value={formValues.city} onChange={handleInputChange} required />
          <select name='state' value={formValues.state} onChange={handleInputChange} required>
            <option value=''>Select State</option>
            {states.map(state => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>

        <label>Card Information</label>
        <input type='text' name='cardNumber' value={formValues.cardNumber} onChange={handleCardInputChange} onBlur={handleCardBlur} placeholder='XXXX XXXX XXXX XXXX' autoComplete='on' maxLength='19' required />
        {formValues.cardError && <div style={{ color: 'red' }}>{formValues.cardError}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <input type='text' name='expiry' placeholder='MM/YY' value={formValues.expiry} onChange={handleExpiryChange} onBlur={handleExpiryBlur} required />
          <input type='text' name='cvv' value={formValues.cvv} onChange={handleCVVInputChange} onBlur={handleCVVBlur} placeholder='CVV' maxLength='4' required />
        </div>
        {formValues.expiryError && <div style={{ color: 'red' }}>{formValues.expiryError}</div>}
        {formValues.cvvError && <div style={{ color: 'red' }}>{formValues.cvvError}</div>}

        <label>Name on Card</label>
        <input type='text' name='nameOnCard' placeholder='Name on Card' value={formValues.nameOnCard} onChange={handleInputChange} required />

        <button type='submit'>Submit</button>
        {submitError && <div style={{ color: 'red' }}>{submitError}</div>}
      </form>
    </>
  );
}

export default App;
