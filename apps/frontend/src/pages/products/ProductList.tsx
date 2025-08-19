import React, { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Typography, Card } from 'antd'
import { setPageTitle, setBreadcrumbs } from '../../store/slices/uiSlice'
import { AppDispatch } from '../../store'

const { Title } = Typography

const ProductList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    dispatch(setPageTitle('Products'))
    dispatch(setBreadcrumbs([
      { label: 'Dashboard', path: '/' },
      { label: 'Products' }
    ]))
  }, [dispatch])

  return (
    <div>
      <Title level={2}>Products</Title>
      <Card>
        <p>Product list will be implemented here...</p>
      </Card>
    </div>
  )
}

export default ProductList