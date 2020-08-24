import React from 'react';
import axios from 'axios';
import './tailwind.generated.css';
import moment from "moment";

const API_ENDPOINT = 'https://hn.algolia.com/api/v1/search?query=';

const useSemiPersistentState = (key, initialState) => {
  const [value, setValue] = React.useState(
    localStorage.getItem(key) || initialState
  );

  React.useEffect(() => {
    localStorage.setItem(key, value);
  }, [value, key]);

  return [value, setValue];
};

const storiesReducer = (state, action) => {
  switch (action.type) {
    case 'STORIES_FETCH_INIT':
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case 'STORIES_FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case 'STORIES_FETCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    case 'REMOVE_STORY':
      return {
        ...state,
        data: state.data.filter(
          story => action.payload.objectID !== story.objectID
        ),
      };
    default:
      throw new Error();
  }
};

const App = () => {
  const [searchTerm, setSearchTerm] = useSemiPersistentState(
    'search',
    'React'
  );

  const [url, setUrl] = React.useState(
    `${API_ENDPOINT}${searchTerm}`
  );

  const [stories, dispatchStories] = React.useReducer(
    storiesReducer,
    { data: [], isLoading: false, isError: false }
  );

  const handleFetchStories = React.useCallback(async () => {
    dispatchStories({ type: 'STORIES_FETCH_INIT' });

    try {
      const result = await axios.get(url);

      dispatchStories({
        type: 'STORIES_FETCH_SUCCESS',
        payload: result.data.hits,
      });
    } catch {
      dispatchStories({ type: 'STORIES_FETCH_FAILURE' });
    }
  }, [url]);

  React.useEffect(() => {
    handleFetchStories();
  }, [handleFetchStories]);

  const handleRemoveStory = item => {
    dispatchStories({
      type: 'REMOVE_STORY',
      payload: item,
    });
  };

  const handleSearchInput = event => {
    setSearchTerm(event.target.value);
  };

  const handleSearchSubmit = event => {
    setUrl(`${API_ENDPOINT}${searchTerm}`);

    event.preventDefault();
  };

  return (
    <div className={"container mx-auto pt-10"}>
      <h1 className={"text-center text-6xl"}>Hacker News</h1>

      <SearchForm
        searchTerm={searchTerm}
        onSearchInput={handleSearchInput}
        onSearchSubmit={handleSearchSubmit}
      />
      <div className={"grid grid-cols-3 gap-4"}>
        {stories.isError && <p>Something went wrong ...</p>}

        {stories.isLoading ? (
          <p>Loading ...</p>
        ) : (
          <List list={stories.data} onRemoveItem={handleRemoveStory} />
        )}
      </div>

    </div>
  );
};

const SearchForm = ({
  searchTerm,
  onSearchInput,
  onSearchSubmit,
}) => (
  <form onSubmit={onSearchSubmit} className={"w-full my-10"}>
    <div className={"md:flex md:items-center flex-wrap justify-between"}>
    <InputWithLabel
      id="search"
      value={searchTerm}
      isFocused
      onInputChange={onSearchInput}
    >
      <strong>Search:</strong>
    </InputWithLabel>

    <button className={"md:w-1/6 bg-red-500 hover:bg-red-300 focus:shadow-outline focus:outline-none text-white font-bold py-3 px-4 rounded"} type="submit" disabled={!searchTerm}>
      Submit
    </button>
    </div>

  </form>
);

const InputWithLabel = ({
  id,
  value,
  type = 'text',
  onInputChange,
  isFocused,
  children,
}) => {
  const inputRef = React.useRef();

  React.useEffect(() => {
    if (isFocused) {
      inputRef.current.focus();
    }
  }, [isFocused]);

  return (
    <>
      <label className={"block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2 w-full"} htmlFor={id}>{children}</label>
      <input
        ref={inputRef}
        id={id}
        type={type}
        value={value}
        onChange={onInputChange}
        className={"w-4/5 appearance-none block bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"}
      />
    </>
  );
};

const List = ({ list, onRemoveItem }) => 

  list.map(item => (
    <Item
      key={item.objectID}
      item={item}
      onRemoveItem={onRemoveItem}
    />
  ));

const Item = ({ item, onRemoveItem }) => (
  <div className={"max-w-sm rounded overflow-hidden shadow-lg px-6 py-4 flex flex-col"}>
    <div className={"text-sm text-gray-600 mb-2"}>{moment(new Date(item.created_at)).format("LL")}</div>
    <div className={"text-2xl font-semibold text-gray-800 mb-4"}>
      <a href={item.url}>{item.title}</a>
    </div>
    <div className={"mb-2 text-sm text-gray-600"}>By {item.author}</div>
    <div className={"mb-2 text-sm text-gray-600"}>{item.num_comments} comments</div>
    <div className={"mb-10 text-sm text-gray-600"}>{item.points} points</div>
    <div className={"text-center mt-auto grid grid-flow-col gap-4"}>
      <a className={"bg-purple-800 hover:bg-purple-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded"} href={item.url}>Read</a>
      <button className={"bg-transparent hover:bg-purple-400 text-purple-800 font-semibold hover:text-white py-2 px-4 border border-purple-800 hover:border-transparent rounded"} type="button" onClick={() => onRemoveItem(item)}>
        Dismiss
      </button>
    </div>
  </div>
);

export default App;
