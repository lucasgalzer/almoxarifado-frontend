const reactSelectStyles = {
  control: (provided) => ({
    ...provided,
    borderRadius: 8,
  }),

  menu: (base) => ({
    ...base,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  }),

  menuList: (base) => ({
    ...base,
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 12,
  }),

  option: (base, state) => ({
    ...base,
    borderRadius: 8,
    marginBottom: 4,
    cursor: 'pointer',
    color: state.isSelected ? '#fff' : '#111827',
    backgroundColor: state.isSelected
      ? '#4c7fca'
      : state.isFocused
        ? '#f3f4f6'
        : '#fff',
  }),
  
}

export default reactSelectStyles