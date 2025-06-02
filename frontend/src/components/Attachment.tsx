import { Badge, Card } from "react-bootstrap";
import { IAttachment } from "../types/order";
import classNames from "classnames";
import pdfImage from "./pdf-file.png";
import { Link } from "react-router-dom";
import { Status } from "../enums/order";


interface MediaComponentProps {
  media: IAttachment;
  handleStatus: (_id: string | number | null, _status: string | null) => void
}

const Attachment: React.FC<MediaComponentProps> = ({ media }) => {
  const labelClass = classNames("", {
    "success": media?.status === Status.DESIGN_APPROVED || media?.status === Status.READY_FOR_PRODUCTION,
    "info": media?.status === Status.PROCESSING,
    "warning": media?.status === Status.WAITING_FOR_APPROVAL,
    "danger": media?.status === Status.REJECTED || media?.status === Status.REVISION_REQUESTED
  });

  return (
    <div className="d-flex align-items-start mb-3 border">
      <div className="p-2">
        <Link to={media.url} target="_blank">
          {media.ext === "pdf" ? (<Card.Img variant="top" src={pdfImage} width={100} height={180} />) : (<Card.Img variant="top" src={media.url} width={100} height={180} />)}
        </Link>
      </div>
      <div className="p-2">
        <h4>{media.name}</h4>
        <p className="mb-0">
          <strong>Status: </strong><Badge bg={labelClass} className="rounded-0">{media.status}</Badge><br />
          <strong>Updated On: </strong>{new Date(media.updated).toLocaleString()}
        </p>
        {media.comment && (
          <p>{media.comment}</p>
        )}
        <Link to={media.url} target="_blank" className="btn btn-sm btn-primary rounded-0">Download</Link>
        {/* {media.status === Status.WAITING_FOR_APPROVAL && (
          <>
            <Button variant="success" onClick={(_e) => handleStatus(media.id, "Approve Revision")} size="sm" className="rounded-0">Approve Revision</Button>
            <Button variant="danger" onClick={(_e) => handleStatus(media.id, "Request Revision")} size="sm" className="rounded-0">Request Revision</Button>
          </>
        )} */}
      </div>
    </div>
  );

  // return (
  //   <Card style={{ width: '12rem' }} className="attachment float-left">
  //     <Link to={media.url} target="_blank">
  //       {media.ext === "pdf"? (<Card.Img variant="top" src={pdfImage} width={100} height={180}/>):(<Card.Img variant="top" src={media.url} width={100} height={180}/>)}
  //     </Link>
  //     <Card.Body>
  //       <Card.Title>{media.name}</Card.Title>
  //       <Card.Text>
  //         <p><strong>Status:</strong> <Badge bg={labelClass}>{media.status}</Badge></p>
  //         <p><small>Updated On: {new Date(media.updated).toLocaleString()}</small></p>
  //       </Card.Text>
  //       {/* {media.status === "Pending" && (
  //         <>
  //           <Button variant="success" onClick={(e) => handleStatus("Accepted")} size="sm" className="rounded-0">Accept</Button>
  //           <Button variant="danger" onClick={(e) => handleStatus("Rejected")} size="sm" className="rounded-0">Reject</Button>
  //         </>
  //       )} */}
  //     </Card.Body>
  //   </Card>
  // );
};

export default Attachment;