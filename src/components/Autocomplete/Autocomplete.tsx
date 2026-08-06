import * as React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete, { type AutocompleteInputChangeReason } from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import { useEffect, useState } from 'react';
import './Autocomplete.css';
import { useAlert } from '../../hooks/useAlert';
import type { Crypto } from '../../api/coingecko.types';
import { formatPrice, formatPercent } from '../../utils/format';
import { describeError } from '../../utils/errorMessage';
import { fetchCoins, fetchMarket } from '../../api/coingecko';

const MIN_QUERY_LENGTH = 3;
const MAX_RESULTS = 10;

const inputSkips:Set<AutocompleteInputChangeReason> = new Set(['selectOption', 'reset', 'blur'])

// mirrors the rounding in formatPercent: a change that prints as 0.00% must not be
// coloured as a move, otherwise the text and the colour contradict each other
const toneFor = (change?: number | null) => {
    if (change === null || change === undefined) return 'is-flat';
    const rounded = Number(change.toFixed(2));
    if (rounded > 0) return 'is-up';
    if (rounded < 0) return 'is-down';
    return 'is-flat';
};

const SearchIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.2-3.2" />
    </svg>
);

interface AsynchronousProps {
    onSelectCrypto: (crypto: Crypto | null) => void;
    symbolsList: Set<string> | undefined;
}
const Asynchronous: React.FC<AsynchronousProps> = ({ onSelectCrypto, symbolsList }) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [options, setOptions] = useState<Crypto[]>([]);
    const [selectedOption, setSelectedOption] = useState<Crypto | null>(null);
    const { showAlert } = useAlert();

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    useEffect(() => {
        const fetchCryptos = async (controller: AbortController) => {
            // /coins/markets only filters by exact name, so the prefix search goes
            // through /search first and the market data is fetched by id.
            let ids: string = '';
            const signal = controller.signal;
            await fetchCoins(inputValue, signal)
                .then((res) => {
                    if (signal.aborted) return;
                    ids = (res ?? [])
                        .filter((coin) => symbolsList?.has((coin.symbol + 'USDT').toUpperCase()))
                        .slice(0, MAX_RESULTS)
                        .map((coin) => coin.id)
                        .join(',');
                    if (!ids) {
                        setOptions([]);
                        return;
                    }
                })
                .catch((err: unknown) => {
                    if (signal.aborted) return;
                    console.error('Failed to fetch cryptos', err);
                    showAlert(describeError(err, 'cryptocurrencies'), 'error');
                })
            if (ids) {
                await fetchMarket(ids, signal)
                    .then((res) => {
                        if (signal.aborted) return;
                        if (res) {
                            setOptions(res.map((coin) => ({
                                name: coin.name,
                                symbol: coin.symbol,
                                id: coin.id,
                                current_price: coin.current_price,
                                market_cap_rank: coin.market_cap_rank,
                                high_24h: coin.high_24h,
                                low_24h: coin.low_24h,
                                image: coin.image,
                                price_change_percentage_24h: coin.price_change_percentage_24h,
                            })));
                        }
                    })
                    .catch((err) => {
                        if (signal.aborted) return;
                        console.error('Failed to fetch markets', err);
                        showAlert(describeError(err, 'markets'), 'error');
                    })
            }
        }
        // wait for the user to stop typing to avoid too many requests
        const controller = new AbortController();
        if (inputValue.length < MIN_QUERY_LENGTH) return;
        const timeoutId = setTimeout(() => {
            fetchCryptos(controller).then(() => {
                setLoading(false);
            });
        }, 500);

        return (() => {
            clearTimeout(timeoutId)
            controller.abort();
        });
    }, [inputValue, symbolsList, showAlert]);

    useEffect(() => {
        if (selectedOption) onSelectCrypto(selectedOption);
    }, [selectedOption, onSelectCrypto]);

    return (
        <Autocomplete
            className="cryptoSearch"
            sx={{ width: '100%', maxWidth: 380 }}
            open={open}
            onOpen={handleOpen}
            onClose={handleClose}
            inputValue={inputValue}
            value={selectedOption}
            onInputChange={(_event, newInputValue, reason) => {
                if (inputSkips.has(reason)) return;
                setLoading(newInputValue.length >= MIN_QUERY_LENGTH);
                setOptions([])
                setInputValue(newInputValue);
            }}
            onChange={(_event, newValue) => {
                setSelectedOption(newValue);
            }}
            filterOptions={(x) => x}
            isOptionEqualToValue={(option, value) => option.name === value.name}
            getOptionLabel={(option) => option.name}
            options={inputValue.length >= MIN_QUERY_LENGTH ? options : []}
            loading={loading}
            loadingText="Searching…"
            noOptionsText={
                inputValue.length < MIN_QUERY_LENGTH
                    ? `Type at least ${MIN_QUERY_LENGTH} characters`
                    : 'No cryptocurrency found'
            }
            disabled={!symbolsList}
            renderOption={(props, option) => {
                const { key, ...optionProps } = props as React.HTMLAttributes<HTMLLIElement> & { key: React.Key };
                const change = option.price_change_percentage_24h;
                const changeClass = toneFor(change);

                return (
                    <li key={key} {...optionProps}>
                        <div className="cryptoOption">
                            <img
                                className="cryptoOption-image"
                                src={option.image}
                                alt=""
                                loading="lazy"
                            />
                            <div className="cryptoOption-main">
                                <span className="cryptoOption-name">{option.name}</span>
                                <span className="cryptoOption-symbol">{option.symbol?.toUpperCase()}</span>
                            </div>
                            <div className="cryptoOption-meta">
                                <span className="cryptoOption-price">{formatPrice(option.current_price)}</span>
                                <span className={`cryptoOption-change ${changeClass}`}>
                                    {formatPercent(change)}
                                </span>
                            </div>
                        </div>
                    </li>
                );
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    placeholder="Search a cryptocurrency…"
                    slotProps={{
                        ...params.slotProps,
                        input: {
                            ...params.slotProps.input,
                            startAdornment: (
                                <InputAdornment position="start" className="cryptoSearch-icon">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <React.Fragment>
                                    {loading ? <CircularProgress color="inherit" size={18} /> : null}
                                    {params.slotProps.input.endAdornment}
                                </React.Fragment>
                            ),
                        },
                    }}
                />
            )}
        />
    );
}

export default Asynchronous;
