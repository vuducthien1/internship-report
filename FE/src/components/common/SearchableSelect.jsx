import { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';

const SearchableSelect = ({
    value,
    onChange,
    fetchOptions,
    placeholder,
    selectedLabel = '',
    disabled = false,
    getOptionLabel = (item) => item.fullname,
    getOptionValue = (item) => item.id,
    getOptionSub = (item) => item.username,
}) => {
    const { t } = useLanguage();
    const [options, setOptions] = useState([]);
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);
    const debounceRef = useRef(null);

    const selectedOption = options.find((o) => String(getOptionValue(o)) === String(value));

    const loadOptions = useCallback(
        async (search = '') => {
            setLoading(true);
            const data = await fetchOptions(search);
            if (data.success) {
                setOptions(data.data);
            }
            setLoading(false);
        },
        [fetchOptions]
    );

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            if (open) loadOptions(query);
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [query, open, loadOptions]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const displayValue = open
        ? query
        : selectedOption
            ? getOptionLabel(selectedOption)
            : value
                ? selectedLabel
                : '';

    const handleSelect = (option) => {
        onChange(getOptionValue(option));
        setQuery('');
        setOpen(false);
    };

    return (
        <div className={`searchable-select ${disabled ? 'disabled' : ''}`} ref={wrapperRef}>
            <div className="searchable-select-input-wrap">
                <input
                    type="text"
                    className="form-input searchable-select-input"
                    value={displayValue}
                    placeholder={placeholder || t('searchPlaceholder')}
                    disabled={disabled}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setOpen(true);
                        if (!e.target.value) onChange('');
                    }}
                    onFocus={() => setOpen(true)}
                />
                <span className="searchable-select-arrow">{open ? '▲' : '▼'}</span>
            </div>

            {open && !disabled && (
                <div className="searchable-select-dropdown">
                    {loading ? (
                        <div className="searchable-select-empty">{t('loading')}</div>
                    ) : options.length > 0 ? (
                        options.map((option) => (
                            <button
                                key={getOptionValue(option)}
                                type="button"
                                className={`searchable-select-option ${
                                    String(getOptionValue(option)) === String(value) ? 'selected' : ''
                                }`}
                                onClick={() => handleSelect(option)}
                            >
                                <span className="searchable-select-option-label">
                                    {getOptionLabel(option)}
                                </span>
                                {getOptionSub(option) && (
                                    <span className="searchable-select-option-sub">
                                        @{getOptionSub(option)}
                                    </span>
                                )}
                            </button>
                        ))
                    ) : (
                        <div className="searchable-select-empty">{t('noResults')}</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
